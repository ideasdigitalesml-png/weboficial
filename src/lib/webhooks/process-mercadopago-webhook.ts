import type { SupabaseClient } from "@supabase/supabase-js";
import type { AuthorizedPaymentDetails, MercadoPagoClient } from "../mercadopago/client";
import { ensureCustomer, ensureContact, registerDomain } from "../resellerclub/client";
import { addProjectDomain, VERCEL_NAMESERVERS } from "../vercel/client";

export interface WebhookEventInput {
  mpEventId: string;
  eventType: string;
  dataId: string;
  rawPayload: unknown;
}

export type ProcessResult =
  | { outcome: "duplicate" }
  | {
      outcome: "processed";
      action:
        | "preapproval_updated"
        | "payment_recorded"
        | "payment_pending" // authorized_payment webhook arrived before MP attempted the charge (status still "scheduled") -- nothing to record yet, a later webhook will carry the outcome.
        | "landing_not_found" // resource is real and valid, but doesn't match any of our landings (external_reference and preapproval_plan_id both came up empty) -- most likely a stale/orphaned MP resource, not our bug.
        | "domain_payment_pending" // one-time "payment" event for a custom_domains purchase, but MP's status isn't "approved" yet (pending/in_process/rejected) -- nothing to register.
        | "domain_not_found" // payment's external_reference doesn't match any custom_domains row -- stale/orphaned MP resource, not our bug.
        | "domain_already_processing" // a second MP notification (different mp_event_id, so webhook_events' uniqueness didn't catch it) for a payment whose custom_domains row already moved past pending_payment -- no-op, not an error.
        | "domain_amount_mismatch" // payment approved, but its transaction_amount doesn't match custom_domains.price_ars -- refused, marked failed, never registered. See custom_domains.failure_reason.
        | "domain_registered" // payment approved, ResellerClub registration + Vercel domain-add both succeeded.
        | "domain_registration_failed" // payment approved and recorded, but registration/DNS wiring failed after -- see custom_domains.failure_reason.
        | "ignored_unknown_type";
    };

// This is the only place (besides the two SECURITY DEFINER RPCs it calls)
// that is allowed to move a subscription/payment/landing forward based on
// a Mercado Pago event. It always runs against a service-role Supabase
// client (RLS doesn't apply) and always re-fetches the real resource state
// from Mercado Pago -- the caller-supplied payload is only ever used to
// know *which* resource to look up, never trusted for its status.
export async function processMercadoPagoWebhook(
  supabase: SupabaseClient,
  mpClient: MercadoPagoClient,
  input: WebhookEventInput
): Promise<ProcessResult> {
  const { data: inserted, error: insertError } = await supabase
    .from("webhook_events")
    .insert({
      mp_event_id: input.mpEventId,
      event_type: input.eventType,
      payload: input.rawPayload,
    })
    .select("id")
    .single();

  if (insertError) {
    if (insertError.code === "23505") {
      return { outcome: "duplicate" };
    }
    throw insertError;
  }

  const webhookEventId = inserted.id as string;

  try {
    let action: Extract<ProcessResult, { outcome: "processed" }>["action"];

    if (input.eventType === "subscription_preapproval") {
      action = await handlePreapprovalEvent(supabase, mpClient, input.dataId);
    } else if (input.eventType === "subscription_authorized_payment") {
      action = await handleAuthorizedPaymentEvent(supabase, mpClient, input.dataId);
    } else if (input.eventType === "payment") {
      action = await handleDomainPaymentEvent(supabase, mpClient, input.dataId);
    } else {
      action = "ignored_unknown_type";
    }

    await supabase
      .from("webhook_events")
      .update({ status: "processed", processed_at: new Date().toISOString() })
      .eq("id", webhookEventId);

    return { outcome: "processed", action };
  } catch (err) {
    // Logged here (not just re-thrown to the route handler) so the message
    // and stack show up in Vercel's runtime logs immediately, with the
    // event context attached -- this is what makes the *next* failure
    // diagnosable without needing retroactive log access.
    console.error(
      `process-mercadopago-webhook failed: eventType=${input.eventType} dataId=${input.dataId} webhookEventId=${webhookEventId}`,
      err
    );
    await supabase
      .from("webhook_events")
      .update({ status: "failed" })
      .eq("id", webhookEventId);
    throw err;
  }
}

async function getActivePlanId(supabase: SupabaseClient): Promise<string> {
  const { data: plan } = await supabase
    .from("plans")
    .select("id")
    .eq("active", true)
    .limit(1)
    .maybeSingle();
  if (!plan) throw new Error("no active plan configured");
  return plan.id as string;
}

// The only status values `subscriptions.status` accepts (DB CHECK
// constraint). MP's preapproval status is normally already one of these,
// but this is the one spot standing between an arbitrary MP response
// string and a Postgres constraint violation -- an unrecognized status
// (rejected, expired, anything MP adds later) is treated as "cancelled"
// (the closest real meaning: this subscription is not collectable) instead
// of throwing and losing the whole webhook.
const SUBSCRIPTION_STATUSES = new Set(["pending", "authorized", "paused", "cancelled"]);
function normalizeSubscriptionStatus(mpStatus: string): string {
  return SUBSCRIPTION_STATUSES.has(mpStatus) ? mpStatus : "cancelled";
}

// Preapprovals created from our own /preapproval calls carry the landing id
// as external_reference. Preapprovals created by the customer visiting a
// plan's generic init_point don't -- MP never lets us set that field for
// them, so those are matched instead via the plan that spawned them
// (landings.mp_plan_id), which is unique per landing. Returns null (rather
// than throwing) when neither resolves to a landing: that's a valid,
// expected outcome for a stale or orphaned MP resource, not a bug -- the
// caller decides what to do with it, and the webhook still gets a 200 so
// MP doesn't keep retrying a delivery we can never resolve.
async function resolveLandingId(
  supabase: SupabaseClient,
  preapproval: { id: string; externalReference: string | null; preapprovalPlanId: string | null }
): Promise<string | null> {
  if (preapproval.externalReference) {
    return preapproval.externalReference;
  }

  if (preapproval.preapprovalPlanId) {
    const { data: landing } = await supabase
      .from("landings")
      .select("id")
      .eq("mp_plan_id", preapproval.preapprovalPlanId)
      .maybeSingle();
    if (landing) return landing.id as string;
  }

  console.warn(
    `preapproval ${preapproval.id} has no external_reference and its preapproval_plan_id (${preapproval.preapprovalPlanId}) doesn't match any landing -- ignoring`
  );
  return null;
}

async function upsertSubscriptionFromPreapproval(
  supabase: SupabaseClient,
  preapproval: {
    id: string;
    status: string;
    externalReference: string | null;
    preapprovalPlanId: string | null;
  }
): Promise<string | null> {
  const landingId = await resolveLandingId(supabase, preapproval);
  if (!landingId) return null;

  const planId = await getActivePlanId(supabase);

  const { data: subscriptionId, error } = await supabase.rpc(
    "upsert_subscription_from_preapproval",
    {
      p_mp_preapproval_id: preapproval.id,
      p_landing_id: landingId,
      p_plan_id: planId,
      p_status: normalizeSubscriptionStatus(preapproval.status),
      p_init_point: null,
    }
  );
  if (error) throw error;
  return subscriptionId as string;
}

async function handlePreapprovalEvent(
  supabase: SupabaseClient,
  mpClient: MercadoPagoClient,
  preapprovalId: string
): Promise<Extract<ProcessResult, { outcome: "processed" }>["action"]> {
  const preapproval = await mpClient.getPreapproval(preapprovalId);
  const subscriptionId = await upsertSubscriptionFromPreapproval(supabase, preapproval);
  return subscriptionId ? "preapproval_updated" : "landing_not_found";
}

// Shared by the live webhook path and reconcileMissedAuthorizedPayments
// below -- both end up with an already-resolved AuthorizedPaymentDetails,
// they just get there differently (a single ID from the webhook payload vs.
// a search result from MP directly).
async function recordAuthorizedPayment(
  supabase: SupabaseClient,
  mpClient: MercadoPagoClient,
  payment: AuthorizedPaymentDetails
): Promise<Extract<ProcessResult, { outcome: "processed" }>["action"]> {
  // "scheduled" means MP hasn't attempted the charge yet -- there's no
  // approved/rejected outcome to record. A later webhook delivery (status
  // "processed" or "recycling", with the nested `payment` object filled
  // in) will carry the real result; this one is a no-op, not a failure.
  if (payment.paymentStatus === null) {
    return "payment_pending";
  }

  const { data: existingSubscription } = await supabase
    .from("subscriptions")
    .select("id")
    .eq("mp_preapproval_id", payment.preapprovalId)
    .maybeSingle();

  let subscriptionId: string | null;
  if (existingSubscription) {
    subscriptionId = existingSubscription.id as string;
  } else {
    // Webhooks can arrive in any order: the payment notification may reach
    // us before the preapproval one, so resolve the subscription by
    // fetching the preapproval directly instead of assuming it exists.
    const preapproval = await mpClient.getPreapproval(payment.preapprovalId);
    subscriptionId = await upsertSubscriptionFromPreapproval(supabase, preapproval);
  }

  if (!subscriptionId) {
    return "landing_not_found";
  }

  // record_approved_payment only activates the landing when this is
  // literally "approved" -- rejected/in_process/etc. just get recorded in
  // `payments` for visibility (see the function body), same as before.
  const { error } = await supabase.rpc("record_approved_payment", {
    p_subscription_id: subscriptionId,
    p_mp_payment_id: payment.id,
    p_status: payment.paymentStatus,
    p_amount: payment.transactionAmount,
    p_currency: payment.currencyId,
    p_mp_payload: payment,
  });
  if (error) throw error;
  return "payment_recorded";
}

async function handleAuthorizedPaymentEvent(
  supabase: SupabaseClient,
  mpClient: MercadoPagoClient,
  paymentId: string
): Promise<Extract<ProcessResult, { outcome: "processed" }>["action"]> {
  const payment = await mpClient.getAuthorizedPayment(paymentId);
  return recordAuthorizedPayment(supabase, mpClient, payment);
}

// Fallback for when subscription_authorized_payment never arrives at all --
// confirmed happening in production: MP's own authorized_payments/search
// showed a charge approved days ago that webhook_events had zero record of
// (not even a failed attempt), leaving the landing stuck in "draft" forever
// with an "authorized" subscription sitting right next to it. Called from
// /api/landings/status with a service-role client (record_approved_payment
// is service_role-only, see 0025_lock_down_domain_rpcs.sql's sibling
// grants) whenever that route notices this exact mismatch. Safe to call
// repeatedly: record_approved_payment's own `where status = 'draft'` guard
// makes it a no-op once the landing is already active.
export async function reconcileMissedAuthorizedPayments(
  supabase: SupabaseClient,
  mpClient: MercadoPagoClient,
  preapprovalId: string
): Promise<{ recorded: boolean }> {
  const payments = await mpClient.searchAuthorizedPayments(preapprovalId);
  const approved = payments.find((p) => p.paymentStatus === "approved");
  if (!approved) {
    return { recorded: false };
  }

  const action = await recordAuthorizedPayment(supabase, mpClient, approved);
  return { recorded: action === "payment_recorded" };
}

// Custom-domain purchases are one-time Checkout Pro payments (see
// createPreference in mercadopago/client.ts), not preapprovals -- MP sends
// these as a plain "payment" webhook event, external_reference = the
// custom_domains.id created by /api/domains/purchase.
async function handleDomainPaymentEvent(
  supabase: SupabaseClient,
  mpClient: MercadoPagoClient,
  paymentId: string
): Promise<Extract<ProcessResult, { outcome: "processed" }>["action"]> {
  const payment = await mpClient.getPayment(paymentId);
  const customDomainId = payment.externalReference;
  if (!customDomainId) {
    console.warn(`payment ${paymentId} has no external_reference -- not a domain purchase, ignoring`);
    return "domain_not_found";
  }

  const { data: customDomain } = await supabase
    .from("custom_domains")
    .select("id, domain, tld, landing_id, price_ars")
    .eq("id", customDomainId)
    .maybeSingle();

  if (!customDomain) {
    console.warn(
      `payment ${paymentId} external_reference ${customDomainId} doesn't match any custom_domains row -- ignoring`
    );
    return "domain_not_found";
  }

  if (payment.status !== "approved") {
    return "domain_payment_pending";
  }

  const { data: activated, error: activateError } = await supabase.rpc(
    "activate_domain_payment",
    {
      p_custom_domain_id: customDomain.id,
      p_mp_payment_id: payment.id,
    }
  );
  if (activateError) throw activateError;

  // The row was already past pending_payment (registration in flight, or
  // already active/failed) -- a different MP notification for this same
  // payment got here first. Registering the domain again would hit
  // ResellerClub a second time for a domain that's already handled.
  if (!activated) {
    return "domain_already_processing";
  }

  // Never register a domain for less (or more) than what /api/domains/purchase
  // actually priced it at -- the checkout amount client-side could in
  // principle be stale or tampered with by the time MP settles the charge.
  // A whole-cent tolerance absorbs float/rounding noise, not a real mismatch
  // (computePriceArs always rounds to a whole peso).
  const AMOUNT_TOLERANCE_ARS = 0.5;
  const priceArs = Number(customDomain.price_ars);
  if (Math.abs(payment.transactionAmount - priceArs) > AMOUNT_TOLERANCE_ARS) {
    const reason = `Monto no coincide: pagado ${payment.transactionAmount}, esperado ${priceArs}`;
    console.error(
      `domain payment amount mismatch for custom_domains.id=${customDomain.id}: ${reason}`
    );
    const { error: mismatchError } = await supabase.rpc("mark_domain_registration_failed", {
      p_custom_domain_id: customDomain.id,
      p_reason: reason,
    });
    if (mismatchError) throw mismatchError;
    return "domain_amount_mismatch";
  }

  // From here on, the payment already succeeded -- any failure below must
  // be recorded via mark_domain_registration_failed (not thrown/left
  // stuck in pending_registration), since the customer already paid.
  try {
    // Captured fresh per purchase by /api/domains/purchase (see
    // domain_registrants' migration comment) -- the domain's titular can be
    // a different person/email each time, so this is never assumed to
    // match the weboficial account owner.
    const { data: registrant } = await supabase
      .from("domain_registrants")
      .select("*")
      .eq("custom_domain_id", customDomain.id)
      .single();
    if (!registrant) throw new Error(`domain_registrants not found for custom_domains.id ${customDomain.id}`);

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

    // ResellerClub's customers/signup.json errors on a repeat signup for
    // the same email, so the "customer" record (not the per-purchase
    // "contact" below) is reused across purchases by email -- independent
    // of which weboficial account is buying, since domain_registrants is
    // per purchase, not per weboficial user.
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

    // No reuse for the "contact" record -- always created fresh. Contacts
    // (unlike customer signups) aren't known to error on repeats, and
    // domain_registrants has no field to cache a contact id against, since
    // it's meant to be an immutable per-purchase record.
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
      p_custom_domain_id: customDomain.id,
      p_resellerclub_order_id: registration.orderId,
      p_expires_at: registration.expiresAt,
    });
    if (finalizeError) throw finalizeError;

    return "domain_registered";
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error(
      `domain registration failed after payment for custom_domains.id=${customDomain.id} (${customDomain.domain})`,
      err
    );
    await supabase.rpc("mark_domain_registration_failed", {
      p_custom_domain_id: customDomain.id,
      p_reason: message,
    });
    return "domain_registration_failed";
  }
}
