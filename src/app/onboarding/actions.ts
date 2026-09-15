"use server";

import { createClient } from "@/lib/supabase/server";
import {
  createLandingForUser,
  checkSlugAvailability,
  type CreateLandingResult,
  type SlugCheckResult,
} from "@/lib/landings/create-landing";

export async function checkSlugAvailabilityAction(
  rawSlug: string
): Promise<SlugCheckResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { valid: false, message: "No autenticado" };
  }

  return checkSlugAvailability(supabase, rawSlug);
}

export async function createLandingAction(input: {
  professionId: string;
  templateId: string;
  formData: Record<string, unknown>;
  desiredSlug: string;
}): Promise<CreateLandingResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { ok: false, reason: "not_authenticated" };
  }

  return createLandingForUser(supabase, user.id, input);
}
