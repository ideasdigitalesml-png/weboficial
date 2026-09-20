"use server";

import { createClient } from "@/lib/supabase/server";
import {
  createLandingForUser,
  checkSlugAvailability,
  type CreateLandingResult,
  type SlugCheckResult,
} from "@/lib/landings/create-landing";

// No auth required: checking whether a slug is taken isn't sensitive, and
// the wizard is reachable by anonymous visitors now (they only need a
// session once they actually publish). is_slug_taken/filter_taken_slugs
// are granted to `public` for exactly this (0013_public_onboarding_read.sql).
export async function checkSlugAvailabilityAction(
  rawSlug: string
): Promise<SlugCheckResult> {
  const supabase = await createClient();
  return checkSlugAvailability(supabase, rawSlug);
}

export async function createLandingAction(input: {
  professionId: string;
  templateId: string;
  formData: Record<string, unknown>;
  desiredSlug: string;
  paletaId?: string;
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
