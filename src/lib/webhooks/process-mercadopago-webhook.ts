import type { SupabaseClient } from "@supabase/supabase-js";
import type { MercadoPagoClient } from "../mercadopago/client";

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

async function handleAuthorizedPaymentEvent(
  supabase: SupabaseClient,
  mpClient: MercadoPagoClient,
  paymentId: string
): Promise<Extract<ProcessResult, { outcome: "processed" }>["action"]> {
  const payment = await mpClient.getAuthorizedPayment(paymentId);

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
