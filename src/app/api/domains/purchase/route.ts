import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { mercadoPagoClient } from "@/lib/mercadopago/client";
import { checkAvailability, getResellerCostArs } from "@/lib/resellerclub/client";
import {
  computePriceArs,
  isValidDomainBaseName,
  SUPPORTED_TLDS,
  type SupportedTld,
} from "@/lib/domains/pricing";
import { checkRateLimit } from "@/lib/rate-limit";
import { checkDomainAccess } from "@/lib/domains/domain-access";

// Longest first, so a multi-label TLD would match before a shorter one it
// ends with (not currently relevant with only ".com" in SUPPORTED_TLDS, but
// keeps this correct if another TLD is added later).
const TLDS_BY_LENGTH_DESC = [...SUPPORTED_TLDS].sort((a, b) => b.length - a.length);

function splitDomain(fullDomain: string): { baseName: string; tld: SupportedTld } | null {
  for (const tld of TLDS_BY_LENGTH_DESC) {
    if (fullDomain.endsWith(`.${tld}`)) {
      return { baseName: fullDomain.slice(0, -(tld.length + 1)), tld };
    }
  }
  return null;
}

interface RegistrantInput {
  fullName?: string;
  email?: string;
  phoneCountryCode?: string;
  phoneNumber?: string;
  addressLine1?: string;
  city?: string;
  state?: string;
  countryCode?: string;
  zipcode?: string;
  companyName?: string;
}

// Same required fields ResellerClub needs to create a customer/contact
// (resellerclub/client.ts's ensureCustomer/ensureContact) -- companyName is
// the only optional one.
function validateRegistrant(input: RegistrantInput | undefined | null) {
  if (!input) return null;
  const required = [
    input.fullName,
    input.email,
    input.phoneCountryCode,
    input.phoneNumber,
    input.addressLine1,
    input.city,
    input.state,
    input.countryCode,
    input.zipcode,
  ];
  if (required.some((v) => !v || !v.trim())) return null;

  return {
    full_name: input.fullName!.trim(),
    email: input.email!.trim(),
    phone_country_code: input.phoneCountryCode!.trim(),
    phone_number: input.phoneNumber!.trim(),
    address_line1: input.addressLine1!.trim(),
    city: input.city!.trim(),
    state: input.state!.trim(),
    country_code: input.countryCode!.trim().toUpperCase(),
    zipcode: input.zipcode!.trim(),
    company_name: input.companyName?.trim() || null,
  };
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ ok: false, reason: "not_authenticated" }, { status: 401 });
  }

  // Business rule: only customers with an active subscription (or admins)
  // may search/buy domains. Enforced here too, not just by hiding the
  // button in DomainSection.tsx -- hiding a button doesn't stop a direct
  // request to this endpoint.
  if (!(await checkDomainAccess(supabase, user.id))) {
    return NextResponse.json({ ok: false, reason: "forbidden" }, { status: 403 });
  }

  // Same Fixie/ResellerClub quota concern as /api/domains/check -- each
  // purchase attempt re-checks availability and re-prices via ResellerClub
  // before charging, so repeated attempts spend quota just like searches do.
  if (!checkRateLimit(`domains-purchase:${user.id}`, 5, 5 * 60 * 1000)) {
    return NextResponse.json({ ok: false, reason: "rate_limited" }, { status: 429 });
  }

  const body = (await request.json().catch(() => null)) as {
    domain?: string;
    registrant?: RegistrantInput;
  } | null;
  const fullDomain = body?.domain?.trim().toLowerCase();
  if (!fullDomain) {
    return NextResponse.json({ ok: false, reason: "invalid_domain" }, { status: 400 });
  }

  const split = splitDomain(fullDomain);
  if (!split || !isValidDomainBaseName(split.baseName)) {
    return NextResponse.json({ ok: false, reason: "invalid_domain" }, { status: 400 });
  }

  // The titular's data is submitted with every purchase (never reused
  // silently across purchases) -- DomainSection.tsx always shows this form
  // before the pay button, precompleted but editable.
  const registrant = validateRegistrant(body?.registrant);
  if (!registrant) {
    return NextResponse.json({ ok: false, reason: "invalid_registrant" }, { status: 400 });
  }

  // user_id is deliberately never read from the request body -- it always
  // comes from the authenticated session, otherwise anyone could attribute
  // a purchase to someone else's account.
  const { data: landing } = await supabase
    .from("landings")
    .select("id, slug")
    .eq("user_id", user.id)
    .maybeSingle();
  if (!landing) {
    return NextResponse.json({ ok: false, reason: "no_landing" }, { status: 400 });
  }

  const { data: existingActive } = await supabase
    .from("custom_domains")
    .select("id")
    .eq("landing_id", landing.id)
    .eq("status", "active")
    .maybeSingle();
  if (existingActive) {
    return NextResponse.json({ ok: false, reason: "already_has_domain" }, { status: 409 });
  }

  // Re-verify availability and recompute the price server-side -- never
  // trust whatever price the client saw on the /check screen, it may be
  // stale by the time they click "Comprar".
  let priceArs: number;
  try {
    const [availability] = await checkAvailability(split.baseName, [split.tld]);
    if (!availability?.available) {
      return NextResponse.json({ ok: false, reason: "domain_taken" }, { status: 409 });
    }
    const costArs = await getResellerCostArs(split.tld);
    priceArs = computePriceArs(costArs, split.tld);
  } catch (err) {
    console.error("domains/purchase pricing/availability re-check failed", err);
    return NextResponse.json({ ok: false, reason: "pricing_unavailable" }, { status: 502 });
  }

  const { data: customDomain, error: insertError } = await supabase
    .from("custom_domains")
    .insert({
      landing_id: landing.id,
      domain: fullDomain,
      tld: split.tld,
      slug: landing.slug,
      status: "pending_payment",
      price_ars: priceArs,
    })
    .select("id")
    .single();

  if (insertError || !customDomain) {
    // domain unique constraint -- someone else already has a pending/active
    // row for this exact domain.
    if (insertError?.code === "23505") {
      return NextResponse.json({ ok: false, reason: "domain_taken" }, { status: 409 });
    }
    console.error("domains/purchase insert failed", insertError);
    return NextResponse.json({ ok: false, reason: "insert_failed" }, { status: 500 });
  }

  const { error: registrantError } = await supabase.from("domain_registrants").insert({
    custom_domain_id: customDomain.id,
    ...registrant,
  });
  if (registrantError) {
    // No MP preference exists yet at this point, so it's safe to fully
    // undo the custom_domains row rather than leave an orphaned
    // pending_payment row with no registrant attached to it.
    console.error("domains/purchase registrant insert failed", registrantError);
    await createAdminClient().from("custom_domains").delete().eq("id", customDomain.id);
    return NextResponse.json({ ok: false, reason: "insert_failed" }, { status: 500 });
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL;
  if (!appUrl) {
    return NextResponse.json({ ok: false, reason: "server_misconfigured" }, { status: 500 });
  }

  try {
    const preference = await mercadoPagoClient.createPreference({
      title: `Dominio ${fullDomain} - weboficial`,
      externalReference: customDomain.id,
      amount: priceArs,
      currency: "ARS",
      backUrls: {
        success: `${appUrl}/dashboard/dominio/processing`,
        failure: `${appUrl}/dashboard/dominio/processing`,
        pending: `${appUrl}/dashboard/dominio/processing`,
      },
      notificationUrl: `${appUrl}/api/webhooks/mercadopago`,
    });

    // custom_domains has no UPDATE policy for authenticated users (only
    // service_role/the webhook RPCs may change a row after insert) -- this
    // one field is server-controlled, set here with the admin client right
    // after the insert this same request just made, not exposed to
    // arbitrary client control.
    await createAdminClient()
      .from("custom_domains")
      .update({ mp_preference_id: preference.id })
      .eq("id", customDomain.id);

    return NextResponse.json({ ok: true, initPoint: preference.initPoint });
  } catch (err) {
    console.error("domains/purchase createPreference failed", err);
    return NextResponse.json({ ok: false, reason: "mercadopago_failed" }, { status: 502 });
  }
}
