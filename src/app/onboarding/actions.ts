"use server";

import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import {
  createLandingForUser,
  checkSlugAvailability,
  type CreateLandingResult,
  type SlugCheckResult,
} from "@/lib/landings/create-landing";
import { REFERRAL_COOKIE_NAME } from "@/lib/resellers/referral-cookie";

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
  // Fallback for when the weboficial_ref cookie didn't make it (blocked
  // cookies, cross-subdomain hiccups): the caller reads its own localStorage
  // copy (see getStoredReferralCode) and passes it here. The cookie, read
  // directly below, always takes priority when both are present since it's
  // the primary, tamper-resistant channel ReferralCapture.tsx writes to.
  referralCode?: string;
}): Promise<CreateLandingResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { ok: false, reason: "not_authenticated" };
  }

  const cookieStore = await cookies();
  const referralCode =
    cookieStore.get(REFERRAL_COOKIE_NAME)?.value ?? input.referralCode;

  return createLandingForUser(supabase, user.id, { ...input, referralCode });
}
