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
  | { outcome: "processed"; action: "preapproval_updated" | "payment_recorded" | "ignored_unknown_type" };

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
    let action: "preapproval_updated" | "payment_recorded" | "ignored_unknown_type";

    if (input.eventType === "subscription_preapproval") {
      await handlePreapprovalEvent(supabase, mpClient, input.dataId);
      action = "preapproval_updated";
    } else if (input.eventType === "subscription_authorized_payment") {
      await handleAuthorizedPaymentEvent(supabase, mpClient, input.dataId);
      action = "payment_recorded";
    } else {
      action = "ignored_unknown_type";
    }

    await supabase
      .from("webhook_events")
      .update({ status: "processed", processed_at: new Date().toISOString() })
      .eq("id", webhookEventId);

    return { outcome: "processed", action };
  } catch (err) {
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

// Preapprovals created from our own /preapproval calls carry the landing id
// as external_reference. Preapprovals created by the customer visiting a
// plan's generic init_point don't -- MP never lets us set that field for
// them, so those are matched instead via the plan that spawned them
// (landings.mp_plan_id), which is unique per landing.
async function resolveLandingId(
  supabase: SupabaseClient,
  preapproval: { id: string; externalReference: string | null; preapprovalPlanId: string | null }
): Promise<string> {
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

  throw new Error(
    `preapproval ${preapproval.id} has no external_reference and its preapproval_plan_id (${preapproval.preapprovalPlanId}) doesn't match any landing`
  );
}

async function upsertSubscriptionFromPreapproval(
  supabase: SupabaseClient,
  preapproval: {
    id: string;
    status: string;
    externalReference: string | null;
    preapprovalPlanId: string | null;
  }
): Promise<string> {
  const landingId = await resolveLandingId(supabase, preapproval);
  const planId = await getActivePlanId(supabase);

  const { data: subscriptionId, error } = await supabase.rpc(
    "upsert_subscription_from_preapproval",
    {
      p_mp_preapproval_id: preapproval.id,
      p_landing_id: landingId,
      p_plan_id: planId,
      p_status: preapproval.status,
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
): Promise<void> {
  const preapproval = await mpClient.getPreapproval(preapprovalId);
  await upsertSubscriptionFromPreapproval(supabase, preapproval);
}

async function handleAuthorizedPaymentEvent(
  supabase: SupabaseClient,
  mpClient: MercadoPagoClient,
  paymentId: string
): Promise<void> {
  const payment = await mpClient.getAuthorizedPayment(paymentId);

  const { data: existingSubscription } = await supabase
    .from("subscriptions")
    .select("id")
    .eq("mp_preapproval_id", payment.preapprovalId)
    .maybeSingle();

  let subscriptionId: string;
  if (existingSubscription) {
    subscriptionId = existingSubscription.id as string;
  } else {
    // Webhooks can arrive in any order: the payment notification may reach
    // us before the preapproval one, so resolve the subscription by
    // fetching the preapproval directly instead of assuming it exists.
    const preapproval = await mpClient.getPreapproval(payment.preapprovalId);
    subscriptionId = await upsertSubscriptionFromPreapproval(supabase, preapproval);
  }

  const { error } = await supabase.rpc("record_approved_payment", {
    p_subscription_id: subscriptionId,
    p_mp_payment_id: payment.id,
    p_status: payment.status,
    p_amount: payment.transactionAmount,
    p_currency: payment.currencyId,
    p_mp_payload: payment,
  });
  if (error) throw error;
}
