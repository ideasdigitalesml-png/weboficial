import type { SupabaseClient } from "@supabase/supabase-js";

// Business rule: domain search/purchase is only for customers with an
// active (paid) subscription -- admins get an unconditional bypass so the
// flow can be tested without a real subscription. Pure predicate so the
// dashboard page (which already fetches profile/subscription for its own
// rendering) can reuse it without a second round-trip; checkDomainAccess
// below does the fetching for callers that don't already have this data
// (the API routes).
export function isDomainAccessAllowed(
  profileRole: string | null | undefined,
  subscriptionStatus: string | null | undefined
): boolean {
  return profileRole === "admin" || subscriptionStatus === "authorized";
}

// Reads through the caller's own RLS-scoped client (never a service-role
// bypass) -- profiles_select_own / subscriptions_select_own already scope
// these to the caller's own rows, same guarantee as every other query in
// the domain routes.
export async function checkDomainAccess(
  supabase: SupabaseClient,
  userId: string
): Promise<boolean> {
  const [{ data: profile }, { data: landing }] = await Promise.all([
    supabase.from("profiles").select("role").eq("id", userId).maybeSingle(),
    supabase.from("landings").select("id").eq("user_id", userId).maybeSingle(),
  ]);

  if (profile?.role === "admin") return true;
  if (!landing) return false;

  const { data: subscription } = await supabase
    .from("subscriptions")
    .select("status")
    .eq("landing_id", landing.id)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  return isDomainAccessAllowed(profile?.role, subscription?.status);
}
