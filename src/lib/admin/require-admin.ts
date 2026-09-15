import { redirect } from "next/navigation";
import type { SupabaseClient, User } from "@supabase/supabase-js";

// Page-level gate for every /admin route: unauthenticated visitors go to
// /login, authenticated non-admins go to /dashboard. This is a UX
// convenience only -- the actual data-level guarantee is the
// `profiles.role = 'admin'` RLS policies (see migrations/0006_admin_panel.sql),
// which this reads through the caller's own RLS-scoped client, never a
// service-role bypass. Even if this check were skipped entirely, a
// non-admin's queries would still only ever return their own rows.
export async function requireAdmin(supabase: SupabaseClient): Promise<User> {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  if (!profile || profile.role !== "admin") {
    redirect("/dashboard");
  }

  return user;
}
