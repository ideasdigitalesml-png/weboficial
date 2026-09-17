"use client";

import { createLandingAction } from "./actions";
import { createSubscriptionAction } from "@/app/dashboard/actions";
import { loadDraftPage, clearDraftPage } from "./draft-storage";

export type PublishOutcome =
  | { status: "no_draft" }
  | { status: "already_has_landing" }
  | { status: "create_failed"; message: string }
  | { status: "subscribe_failed"; message: string };

function describeCreateFailure(
  reason: string,
  errors?: Record<string, string>
): string {
  switch (reason) {
    case "not_authenticated":
      return "Se cerró tu sesión. Iniciá sesión de nuevo para continuar.";
    case "invalid_profession_or_template":
      return "La profesión o plantilla elegida ya no está disponible.";
    case "invalid_form_data":
      return (
        errors?._form ??
        "Algunos datos del formulario no son válidos. Volvé al formulario para revisarlos."
      );
    case "invalid_slug":
      return "El subdominio elegido no es válido. Volvé al formulario para elegir otro.";
    case "slug_taken":
      return "Ese subdominio ya está en uso. Volvé al formulario para elegir otro.";
    case "no_active_plan":
      return "No hay un plan activo configurado. Intentá de nuevo en unos minutos.";
    default:
      return "No se pudo crear tu página. Intentá de nuevo.";
  }
}

// Single place that turns a sessionStorage draft into a real landing and
// then hands off to the existing Mercado Pago checkout -- used both by an
// already-logged-in visitor clicking "Publicar" directly, and by
// /onboarding/publishing right after a fresh Google sign-in.
//
// createLandingAction already refuses to run without a session (the
// landings_insert_own RLS policy requires auth.uid() = user_id), so this
// function is only ever meaningfully callable post-login -- exactly the
// point in the flow it's used from.
export async function publishDraftPage(): Promise<PublishOutcome> {
  const draft = loadDraftPage();
  if (!draft) {
    return { status: "no_draft" };
  }

  const result = await createLandingAction({
    professionId: draft.professionId,
    templateId: draft.templateId,
    formData: draft.formData,
    desiredSlug: draft.desiredSlug,
  });

  if (!result.ok) {
    if (result.reason === "already_has_landing") {
      clearDraftPage();
      return { status: "already_has_landing" };
    }
    // Keep the draft on every other failure so the visitor can go back to
    // the form and retry without retyping everything.
    return {
      status: "create_failed",
      message: describeCreateFailure(
        result.reason,
        result.reason === "invalid_form_data" ? result.errors : undefined
      ),
    };
  }

  clearDraftPage();

  // createSubscriptionAction redirects (throws NEXT_REDIRECT) on every
  // success path -- reusing an existing pending subscription's checkout
  // link, or a freshly created one. Reaching this line means it did not
  // redirect, i.e. it failed.
  const subscribeResult = await createSubscriptionAction();
  return { status: "subscribe_failed", message: subscribeResult.message };
}
