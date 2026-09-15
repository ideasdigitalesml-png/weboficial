"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { mercadoPagoClient } from "@/lib/mercadopago/client";
import {
  updateLandingFormData,
  updateLandingSectionsConfig,
  type UpdateFormDataResult,
  type UpdateSectionsConfigResult,
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
    .select("id, slug, status")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!landing) {
    return { ok: false, message: "No tenés una landing todavía" };
  }
  if (landing.status !== "draft") {
    return { ok: false, message: "Tu landing ya no está en borrador" };
  }

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

  // MP_TEST_PAYER_EMAIL only exists in development .env files (a sandbox
  // "buyer" test user's email, from MP's Test Users panel). It must never
  // be set in production, so this falls back to the real logged-in user's
  // email there automatically -- no NODE_ENV branching, no test-mode flag.
  const payerEmail = process.env.MP_TEST_PAYER_EMAIL || user.email!;

  const preapproval = await mercadoPagoClient.createPreapproval({
    reason: `Suscripción landing - ${landing.slug}`,
    payerEmail,
    amount: Number(plan.amount),
    currency: plan.currency,
    backUrl: `${appUrl}/dashboard/processing`,
    externalReference: landing.id,
  });

  const { error: insertError } = await supabase.from("subscriptions").insert({
    landing_id: landing.id,
    plan_id: plan.id,
    mp_preapproval_id: preapproval.id,
    status: "pending",
    init_point: preapproval.initPoint,
  });

  if (insertError) {
    return { ok: false, message: "No se pudo registrar la suscripción" };
  }

  redirect(preapproval.initPoint);
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
