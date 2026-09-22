"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { mercadoPagoClient } from "@/lib/mercadopago/client";
import {
  updateLandingFormData,
  updateLandingSectionsConfig,
  updateLandingPaleta,
  type UpdateFormDataResult,
  type UpdateSectionsConfigResult,
  type UpdateLandingPaletaResult,
} from "@/lib/landings/update-landing";

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

  const { data: plan } = await supabase
    .from("plans")
    .select("id, amount, currency")
    .eq("active", true)
    .limit(1)
    .maybeSingle();

  if (!plan) {
    return { ok: false, message: "No hay un plan activo configurado" };
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

  redirect(preapprovalPlan.initPoint);
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
