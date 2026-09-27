import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { ensureCustomer, ensureContact, registerDomain } from "@/lib/resellerclub/client";
import { addProjectDomain, VERCEL_NAMESERVERS } from "@/lib/vercel/client";

// TEMPORARY, one-off manual recovery for a single stuck row: a customer
// already paid (Mercado Pago) but ResellerClub registration failed on the
// password-validation bug (fixed in commit 7438f65). Nothing about that
// payment is re-touched here -- this only replays the ResellerClub/Vercel
// side of handleDomainPaymentEvent for one custom_domains.id, using the
// registrant data already captured in domain_registrants.
//
// The target row is identified via env vars (RECOVERY_CUSTOM_DOMAIN_ID /
// RECOVERY_EXPECTED_DOMAIN), not hardcoded -- this file is committed to a
// git remote, and a real customer's domain/DB id has no business sitting
// in source history. Gated the same way /api/admin/egress-ip is
// (profiles.role = 'admin' session) -- delete this route once used.
export async function POST() {
  const customDomainId = process.env.RECOVERY_CUSTOM_DOMAIN_ID;
  const expectedDomain = process.env.RECOVERY_EXPECTED_DOMAIN;
  if (!customDomainId || !expectedDomain) {
    return NextResponse.json({ error: "server_misconfigured" }, { status: 500 });
  }

  const sessionClient = await createClient();
  const {
    data: { user },
  } = await sessionClient.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "not_authenticated" }, { status: 401 });
  }

  const { data: profile } = await sessionClient
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();
  if (!profile || profile.role !== "admin") {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const supabase = createAdminClient();

  const { data: customDomain } = await supabase
    .from("custom_domains")
    .select("id, domain, status")
    .eq("id", customDomainId)
    .maybeSingle();

  if (!customDomain) {
    return NextResponse.json({ step: "lookup", error: "custom_domains row not found" }, { status: 404 });
  }
  if (customDomain.domain !== expectedDomain) {
    return NextResponse.json(
      { step: "safety_check", error: `expected ${expectedDomain}, found ${customDomain.domain}` },
      { status: 400 }
    );
  }
  if (customDomain.status !== "failed") {
    return NextResponse.json({ step: "status_check", skipped: true, status: customDomain.status });
  }

  const { data: registrant } = await supabase
    .from("domain_registrants")
    .select("*")
    .eq("custom_domain_id", customDomainId)
    .maybeSingle();
  if (!registrant) {
    return NextResponse.json({ step: "registrant_lookup", error: "domain_registrants not found" }, { status: 404 });
  }

  // Move it back into pending_registration (mirrors what activate_domain_payment
  // already did once for this row -- the payment side is not re-run) so
  // finalize_domain_registration's `where status = 'pending_registration'`
  // guard matches at the end of this.
  const { error: resetError } = await supabase
    .from("custom_domains")
    .update({ status: "pending_registration", failure_reason: null })
    .eq("id", customDomainId)
    .eq("status", "failed");
  if (resetError) {
    return NextResponse.json({ step: "reset_status", error: resetError.message }, { status: 500 });
  }

  const registrantContact = {
    fullName: registrant.full_name,
    email: registrant.email,
    phoneCountryCode: registrant.phone_country_code,
    phoneNumber: registrant.phone_number,
    addressLine1: registrant.address_line1,
    city: registrant.city,
    state: registrant.state,
    countryCode: registrant.country_code,
    zipcode: registrant.zipcode,
    companyName: registrant.company_name,
  };

  try {
    const { data: cachedCustomer } = await supabase
      .from("resellerclub_customers")
      .select("resellerclub_customer_id")
      .eq("email", registrant.email)
      .maybeSingle();

    const customerId = await ensureCustomer(
      registrantContact,
      cachedCustomer?.resellerclub_customer_id ?? null
    );
    if (customerId !== cachedCustomer?.resellerclub_customer_id) {
      await supabase
        .from("resellerclub_customers")
        .upsert({ email: registrant.email, resellerclub_customer_id: customerId });
    }

    const contactId = await ensureContact(registrantContact, customerId, null);

    const registration = await registerDomain({
      domain: customDomain.domain,
      years: 1,
      customerId,
      contactId,
      nameservers: VERCEL_NAMESERVERS,
    });

    await addProjectDomain(customDomain.domain);

    const { error: finalizeError } = await supabase.rpc("finalize_domain_registration", {
      p_custom_domain_id: customDomainId,
      p_resellerclub_order_id: registration.orderId,
      p_expires_at: registration.expiresAt,
    });
    if (finalizeError) {
      return NextResponse.json({ step: "finalize_domain_registration", error: finalizeError.message }, { status: 500 });
    }

    return NextResponse.json({
      ok: true,
      status: "configuring",
      resellerclubOrderId: registration.orderId,
      expiresAt: registration.expiresAt,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    await supabase.rpc("mark_domain_registration_failed", {
      p_custom_domain_id: customDomainId,
      p_reason: message,
    });
    return NextResponse.json({ ok: false, step: "registration", error: message }, { status: 502 });
  }
}
