# Meta Pixel: CompleteRegistration tracking

Fires `CompleteRegistration` (Meta Pixel + Conversions API) exactly once per
user, on their first Google login/signup — not on every subsequent sign-in,
and not tied to any specific post-login route.

## How it works

1. **`supabase/migrations/0042_registration_tracked_at.sql`** adds
   `profiles.registration_tracked_at` and a `BEFORE UPDATE` trigger that
   silently reverts any change to that column unless the role is
   `service_role` or `postgres`. This is what makes the column
   server-write-only despite `profiles` otherwise granting `UPDATE` to
   `authenticated` at the table level.
2. **`src/app/auth/callback/route.ts`**, right after
   `exchangeCodeForSession`, does an atomic check-and-set with the
   service-role client: `UPDATE profiles SET registration_tracked_at = now()
   WHERE id = ... AND registration_tracked_at IS NULL`. Only the one request
   that actually flips the column from `null` proceeds to track the event —
   this is what guarantees "once per user" even under retries or concurrent
   logins.
3. On that first-time flip, the route sets a short-lived `cr_eid` cookie
   (not a query param — a query param gets dropped by any server-side
   `redirect()` in the post-login chain, e.g. `/` → `/dashboard`; a cookie
   survives all of them) and schedules the Conversions API call via
   `after()` so it never adds latency to the login redirect itself.
4. **`src/components/CompleteRegistrationPixel.tsx`**, mounted once in the
   root layout (so it applies no matter which page the user lands on first),
   reads and clears the `cr_eid` cookie on mount and fires
   `fbq('track', 'CompleteRegistration', {}, { eventID })`.
5. **`src/lib/meta/capi.ts`** sends the same event server-side to the
   Conversions API with the same `event_id`, plus hashed email, IP, user
   agent, and `_fbp`/`_fbc` cookies — Meta dedupes the browser and server
   copies by that shared `event_id`.

## Environment variables

- `NEXT_PUBLIC_META_PIXEL_ID` — optional. Pixel ID isn't secret; falls back
  to the ID hardcoded in `src/lib/meta/pixel.ts` if unset.
- `FB_CONVERSIONS_API_ACCESS_TOKEN` — required, server-only secret. Events
  Manager → pixel → Settings → Conversions API → Generate access token.
- `META_TEST_EVENT_CODE` — only while testing (Events Manager → Test Events
  tab). **Must be unset in production** — while set, events only show up
  under Test Events and aren't counted for real attribution.

## Retesting

`registration_tracked_at` is server-write-only, so to fire the event again
for an account you've already tested with, reset it from the Supabase SQL
editor (runs as `postgres`, which the trigger exempts):

```sql
update public.profiles
set registration_tracked_at = null
where email = 'you@example.com';
```

Then log in again with that account and check Events Manager → Test Events
(with `META_TEST_EVENT_CODE` set) for a browser + server `CompleteRegistration`
pair reporting the same event ID as deduplicated.
