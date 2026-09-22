"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { mercadoPagoClient } from "@/lib/mercadopago/client";
import type { SupabaseClient } from "@supabase/supabase-js";
import {
  updateLandingFormData,
  updateLandingSectionsConfig,
  updateLandingPaleta,
  type UpdateFormDataResult,
  type UpdateSectionsConfigResult,
  type UpdateLandingPaletaResult,
} from "@/lib/landings/update-landing";

const ACTIVE_PLAN_COLUMNS = "id, amount, currency" as const;

// Shared by createSubscriptionAction and createAuthorizedSubscriptionAction:
// every contador/abogado landing gets its own Mercado Pago preapproval_plan
// (not a shared one), created lazily on whichever "pagar" path the user
// takes first. Returns the existing plan id if the landing already has one.
type EnsureLandingPlanResult =
  | { ok: true; planId: string; initPoint: string; amount: number; currency: string }
  | { ok: false; message: string };

async function ensureLandingPlan(
  supabase: SupabaseClient,
  landing: {
    id: string;
    slug: string;
    mp_plan_id: string | null;
    mp_plan_init_point: string | null;
  }
): Promise<EnsureLandingPlanResult> {
  const { data: plan } = await supabase
    .from("plans")
    .select(ACTIVE_PLAN_COLUMNS)
    .eq("active", true)
    .limit(1)
    .maybeSingle();

  if (!plan) {
    return { ok: false, message: "No hay un plan activo configurado" };
  }

  if (landing.mp_plan_id && landing.mp_plan_init_point) {
    return {
      ok: true,
      planId: landing.mp_plan_id,
      initPoint: landing.mp_plan_init_point,
      amount: Number(plan.amount),
      currency: plan.currency,
    };
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL;
  if (!appUrl) {
    return { ok: false, message: "NEXT_PUBLIC_APP_URL no está configurada" };
  }

  const preapprovalPlan = await mercadoPagoClient.createPreapprovalPlan({
    reason: `Suscripción landing - ${landing.slug}`,
    externalReference: landing.id,
    amount: Number(plan.amount),
    currency: plan.currency,
    backUrl: `${appUrl}/dashboard/processing`,
  });

  const { error: updateError } = await supabase
    .from("landings")
    .update({
      mp_plan_id: preapprovalPlan.id,
      mp_plan_init_point: preapprovalPlan.initPoint,
    })
    .eq("id", landing.id);

  if (updateError) {
    return { ok: false, message: "No se pudo registrar el plan de suscripción" };
  }

  return {
    ok: true,
    planId: preapprovalPlan.id,
    initPoint: preapprovalPlan.initPoint,
    amount: Number(plan.amount),
    currency: plan.currency,
  };
}

export async function createSubscriptionAction(): Promise<{
  ok: false;
  message: string;
}> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { ok: false, message: "No autenticado" };
  }

  const { data: landing } = await supabase
    .from("landings")
    .select("id, slug, status, mp_plan_id, mp_plan_init_point")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!landing) {
    return { ok: false, message: "No tenés una landing todavía" };
  }
  if (landing.status !== "draft") {
    return { ok: false, message: "Tu landing ya no está en borrador" };
  }

  // Backward compat: landings from before the switch to plan-based
  // subscriptions may still have an ad-hoc preapproval pending/authorized.
  const { data: existing } = await supabase
    .from("subscriptions")
    .select("id, init_point")
    .eq("landing_id", landing.id)
    .in("status", ["pending", "authorized"])
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (existing?.init_point) {
    redirect(existing.init_point);
  }

  // Each landing gets its own subscription plan in Mercado Pago instead of
  // an ad-hoc preapproval: the plan's checkout link lets the customer pick
  // any Mercado Pago account (or card, no account needed) rather than
  // locking the checkout to one pre-specified payer_email. Reuse it if this
  // landing already has one.
  if (landing.mp_plan_init_point) {
    redirect(landing.mp_plan_init_point);
  }

  const planResult = await ensureLandingPlan(supabase, landing);
  if (!planResult.ok) {
    return planResult;
  }

  redirect(planResult.initPoint);
}

export type CreateAuthorizedSubscriptionResult =
  | { ok: true }
  | { ok: false; message: string };

// Card Payment Brick flow: the customer types their card directly into
// weboficial.com.ar (tokenized client-side by MP.js, we only ever see the
// opaque cardTokenId), and we authorize the subscription immediately via
// the API instead of redirecting to Mercado Pago's hosted checkout. This
// deliberately does NOT write to `subscriptions` here -- that table is only
// ever written by the webhook (see process-mercadopago-webhook.ts), which
// re-fetches the real preapproval from MP rather than trusting whatever we
// optimistically believe right after creation. MP notifies the webhook
// (subscription_preapproval) within moments of this call succeeding, and
// /dashboard/processing already polls until the landing goes active.
export async function createAuthorizedSubscriptionAction(
  landingId: string,
  cardTokenId: string,
  payerEmail: string
): Promise<CreateAuthorizedSubscriptionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { ok: false, message: "No autenticado" };
  }

  const { data: landing } = await supabase
    .from("landings")
    .select("id, slug, status, mp_plan_id, mp_plan_init_point")
    .eq("id", landingId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (!landing) {
    return { ok: false, message: "No se encontró tu landing" };
  }
  if (landing.status !== "draft") {
    return { ok: false, message: "Tu landing ya no está en borrador" };
  }

  const planResult = await ensureLandingPlan(supabase, landing);
  if (!planResult.ok) {
    return planResult;
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL;
  if (!appUrl) {
    return { ok: false, message: "NEXT_PUBLIC_APP_URL no está configurada" };
  }

  try {
    await mercadoPagoClient.createAuthorizedPreapproval({
      cardTokenId,
      payerEmail,
      reason: `Suscripción landing - ${landing.slug}`,
      externalReference: landing.id,
      amount: planResult.amount,
      currency: planResult.currency,
      backUrl: `${appUrl}/dashboard`,
      preapprovalPlanId: planResult.planId,
    });
  } catch (error) {
    console.error("createAuthorizedPreapproval failed", error);
    return {
      ok: false,
      message: "No se pudo procesar el pago con esa tarjeta. Probá con otra o intentá de nuevo.",
    };
  }

  return { ok: true };
}

export async function updateLandingFormDataAction(
  landingId: string,
  formData: Record<string, unknown>
): Promise<UpdateFormDataResult | { ok: false; reason: "not_authenticated" }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { ok: false, reason: "not_authenticated" };
  }

  return updateLandingFormData(supabase, user.id, landingId, formData);
}

export async function updateLandingSectionsConfigAction(
  landingId: string,
  sectionsConfig: unknown
): Promise<
  UpdateSectionsConfigResult | { ok: false; reason: "not_authenticated" }
> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { ok: false, reason: "not_authenticated" };
  }

  return updateLandingSectionsConfig(supabase, user.id, landingId, sectionsConfig);
}

// TODO: integrate with Mercado Pago (cancel the preapproval, let the landing
// stay active until the paid period ends, then flip status via the
// existing webhook path) instead of this controlled dead end.
export async function cancelSubscriptionAction(): Promise<{
  ok: false;
  message: string;
}> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { ok: false, message: "No autenticado" };
  }

  return {
    ok: false,
    message:
      "La cancelación vía panel estará disponible próximamente. Escribinos a ideasdigitalesml@gmail.com para gestionar tu baja.",
  };
}

export async function updateLandingPaletaAction(
  landingId: string,
  paletaId: string
): Promise<UpdateLandingPaletaResult | { ok: false; reason: "not_authenticated" }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { ok: false, reason: "not_authenticated" };
  }

  return updateLandingPaleta(supabase, user.id, landingId, paletaId);
}
