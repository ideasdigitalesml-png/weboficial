-- Ad-campaign attribution: first-touch UTM params captured client-side by
-- ReferralCapture.tsx (cookie `weboficial_utm` / localStorage
-- `weboficial_utm_params`, see src/lib/utm-cookie.ts) and persisted here at
-- landing-creation time by createLandingForUser, same "capture on first
-- touch, write once at signup" shape as landings.reseller_id /
-- landings.referral_code (0027_resellers.sql). Lets admins see which ad
-- campaign brought each user.

alter table public.landings
  add column utm_source text,
  add column utm_medium text,
  add column utm_campaign text,
  add column utm_content text,
  add column utm_term text;
