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
import { UTM_COOKIE_NAME, type UtmParams } from "@/lib/utm-cookie";
import type { TurnosConfig } from "@/lib/turnos/types";
import { buildTurnosBookingData, type TurnosBookingData } from "@/lib/turnos/booking-data";

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
  turnosConfig?: TurnosConfig;
  // Fallback for when the weboficial_ref cookie didn't make it (blocked
  // cookies, cross-subdomain hiccups): the caller reads its own localStorage
  // copy (see getStoredReferralCode) and passes it here. The cookie, read
  // directly below, always takes priority when both are present since it's
  // the primary, tamper-resistant channel ReferralCapture.tsx writes to.
  referralCode?: string;
  // Same fallback shape as referralCode above, for the weboficial_utm
  // cookie -- see getStoredUtmParams.
  utmParams?: UtmParams;
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

  const utmCookieRaw = cookieStore.get(UTM_COOKIE_NAME)?.value;
  let utmParams = input.utmParams;
  if (utmCookieRaw) {
    try {
      utmParams = JSON.parse(utmCookieRaw) as UtmParams;
    } catch {
      // Malformed cookie value -- fall back to whatever the client passed.
    }
  }

  return createLandingForUser(supabase, user.id, {
    ...input,
    referralCode,
    utmParams,
  });
}

// buildTurnosBookingData fetches the holiday calendar (see
// getArgentinaHolidays), a cross-origin call to a third-party API -- fine
// server-side, but calling it directly from the wizard's client-side
// preview effect hits that API straight from the browser, which the API
// doesn't send CORS headers for ("Failed to fetch", surfaced as a Next.js
// dev-overlay error even though the function's own try/catch falls back
// gracefully). Routing it through a server action keeps the fetch
// server-side, same as every other page that computes a turnos preview.
export async function buildTurnosBookingPreviewAction(
  turnosConfig: TurnosConfig,
  formData: unknown,
  professionSlug: string,
  templateConfig: { layout?: string; primaryColor?: string; secondaryColor?: string }
): Promise<TurnosBookingData> {
  return buildTurnosBookingData(turnosConfig, formData, professionSlug, templateConfig);
}
