// Single source of truth for the UTM-capture cookie/localStorage key, TTL,
// and the param shape -- shared between ReferralCapture.tsx (writes it),
// get-stored-utm-params.ts (reads/clears it), and the "use server" actions
// that read the cookie via next/headers. Never construct these strings
// elsewhere. Mirrors referral-cookie.ts's shape, kept as a separate pair of
// keys since UTM attribution and reseller referral attribution are
// independent first-touch signals.
export const UTM_COOKIE_NAME = "weboficial_utm";
export const UTM_STORAGE_KEY = "weboficial_utm_params";
export const UTM_COOKIE_MAX_AGE_SECONDS = 30 * 24 * 60 * 60;

export const UTM_PARAM_KEYS = [
  "utm_source",
  "utm_medium",
  "utm_campaign",
  "utm_content",
  "utm_term",
] as const;

export type UtmParamKey = (typeof UTM_PARAM_KEYS)[number];

export type UtmParams = Partial<Record<UtmParamKey, string>>;
