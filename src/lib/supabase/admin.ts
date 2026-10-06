import { createClient } from "@supabase/supabase-js";

// Service role client. This bypasses RLS entirely, so it must only ever be
// imported from server-only code that genuinely needs to act outside any
// user's session -- currently that's the Mercado Pago webhook and the
// auth/callback route's one-time registration_tracked_at check-and-set.
// Never import this from a Client Component, a Server Action reachable
// with user input as the only guard, or anything that could leak the key.
export function createAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}
