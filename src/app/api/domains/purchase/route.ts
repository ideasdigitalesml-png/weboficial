import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { mercadoPagoClient } from "@/lib/mercadopago/client";
import { checkAvailability, getResellerCost } from "@/lib/resellerclub/client";
import {
  computePriceArs,
  isValidDomainBaseName,
  SUPPORTED_TLDS,
  type SupportedTld,
} from "@/lib/domains/pricing";

// Longest first so "miempresa.com.ar" matches the "com.ar" TLD instead of
// being mis-split on "com".
const TLDS_BY_LENGTH_DESC = [...SUPPORTED_TLDS].sort((a, b) => b.length - a.length);

function splitDomain(fullDomain: string): { baseName: string; tld: SupportedTld } | null {
  for (const tld of TLDS_BY_LENGTH_DESC) {
    if (fullDomain.endsWith(`.${tld}`)) {
      return { baseName: fullDomain.slice(0, -(tld.length + 1)), tld };
    }
  }
  return null;
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ ok: false, reason: "not_authenticated" }, { status: 401 });
  }

  const body = (await request.json().catch(() => null)) as { domain?: string } | null;
  const fullDomain = body?.domain?.trim().toLowerCase();
  if (!fullDomain) {
    return NextResponse.json({ ok: false, reason: "invalid_domain" }, { status: 400 });
  }

  const split = splitDomain(fullDomain);
  if (!split || !isValidDomainBaseName(split.baseName)) {
    return NextResponse.json({ ok: false, reason: "invalid_domain" }, { status: 400 });
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

  const { data: contact } = await supabase
    .from("registrant_contacts")
    .select("user_id")
    .eq("user_id", user.id)
    .maybeSingle();
  if (!contact) {
    return NextResponse.json({ ok: false, reason: "missing_registrant_contact" }, { status: 400 });
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
    const costUsd = await getResellerCost(split.tld);
    priceArs = computePriceArs(costUsd, split.tld);
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
