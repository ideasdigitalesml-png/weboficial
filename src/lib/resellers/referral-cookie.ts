// Single source of truth for the referral-capture cookie/localStorage key and
// TTL, shared between ReferralCapture.tsx (writes it), the onboarding flow
// (reads it as a localStorage fallback), and the "use server" actions that
// read the cookie via next/headers. Never construct this string elsewhere.
export const REFERRAL_COOKIE_NAME = "weboficial_ref";
export const REFERRAL_STORAGE_KEY = "weboficial_ref";
export const REFERRAL_COOKIE_MAX_AGE_SECONDS = 30 * 24 * 60 * 60;
