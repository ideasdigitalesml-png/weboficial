import type { SupabaseClient } from "@supabase/supabase-js";

// Every query below runs against the caller's own RLS-scoped Supabase
// client -- reaches every reseller/landing/commission row only because the
// `*_select_admin` policies (0006_admin_panel.sql, 0027_resellers.sql) make
// them visible to an admin, same pattern as lib/admin/queries.ts.

export interface AdminResellerListItem {
  id: string;
  name: string;
  email: string;
  referralCode: string;
  status: string;
  activeClients: number;
  totalCommissions: number;
  createdAt: string;
}

export async function fetchAdminResellerList(
  supabase: SupabaseClient
): Promise<AdminResellerListItem[]> {
  const [{ data: resellers }, { data: landings }, { data: commissions }] = await Promise.all([
    supabase
      .from("resellers")
      .select("id, name, email, referral_code, status, created_at")
      .order("created_at", { ascending: false }),
    supabase.from("landings").select("reseller_id, status").not("reseller_id", "is", null),
    supabase.from("reseller_commissions").select("reseller_id, commission_amount"),
  ]);

  const activeClientsByReseller = new Map<string, number>();
  for (const l of landings ?? []) {
    if (l.status === "active" && l.reseller_id) {
      activeClientsByReseller.set(
        l.reseller_id,
        (activeClientsByReseller.get(l.reseller_id) ?? 0) + 1
      );
    }
  }

  const commissionsByReseller = new Map<string, number>();
  for (const c of commissions ?? []) {
    commissionsByReseller.set(
      c.reseller_id,
      (commissionsByReseller.get(c.reseller_id) ?? 0) + Number(c.commission_amount)
    );
  }

  return (resellers ?? []).map((r) => ({
    id: r.id,
    name: r.name,
    email: r.email,
    referralCode: r.referral_code,
    status: r.status,
    activeClients: activeClientsByReseller.get(r.id) ?? 0,
    totalCommissions: commissionsByReseller.get(r.id) ?? 0,
    createdAt: r.created_at,
  }));
}

export interface AdminPayoutRequestItem {
  id: string;
  resellerName: string;
  amount: number;
  cbuAlias: string;
  requestedAt: string;
}

export async function fetchPendingPayoutRequests(
  supabase: SupabaseClient
): Promise<AdminPayoutRequestItem[]> {
  const { data } = await supabase
    .from("reseller_payout_requests")
    .select("id, amount, cbu_alias, requested_at, resellers(name)")
    .eq("status", "pending")
    .order("requested_at", { ascending: true });

  return (data ?? []).map((p) => ({
    id: p.id,
    resellerName:
      (p.resellers as unknown as { name: string } | null)?.name ?? "—",
    amount: Number(p.amount),
    cbuAlias: p.cbu_alias,
    requestedAt: p.requested_at,
  }));
}
