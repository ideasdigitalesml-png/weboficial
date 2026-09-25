import { redirect } from "next/navigation";
import type { SupabaseClient, User } from "@supabase/supabase-js";

export interface ResellerRecord {
  id: string;
  name: string;
  referralCode: string;
  cbuAlias: string | null;
}

// Page-level gate for /reseller/dashboard: unauthenticated visitors go to
// /login, authenticated users without an active reseller row go to
// /dashboard. Mirrors require-admin.ts -- this is a UX convenience only, the
// actual data-level guarantee is resellers_select_own (and the sibling
// reseller_commissions/reseller_payout_requests) RLS policies, which this
// reads through the caller's own RLS-scoped client, never a service-role
// bypass.
export async function requireReseller(
  supabase: SupabaseClient
): Promise<{ user: User; reseller: ResellerRecord }> {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: reseller } = await supabase
    .from("resellers")
    .select("id, name, referral_code, cbu_alias")
    .eq("user_id", user.id)
    .eq("status", "active")
    .maybeSingle();

  if (!reseller) {
    redirect("/dashboard");
  }

  return {
    user,
    reseller: {
      id: reseller.id,
      name: reseller.name,
      referralCode: reseller.referral_code,
      cbuAlias: reseller.cbu_alias,
    },
  };
}

// Used by /dashboard to auto-redirect an active reseller straight to their
// own panel -- a plain select, no redirect() call, so the caller decides
// what "not a reseller" means for that page instead of this function forcing
// a navigation.
export async function findActiveResellerForUser(
  supabase: SupabaseClient,
  userId: string
): Promise<boolean> {
  const { data } = await supabase
    .from("resellers")
    .select("id")
    .eq("user_id", userId)
    .eq("status", "active")
    .maybeSingle();

  return Boolean(data);
}
