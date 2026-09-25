import type { SupabaseClient } from "@supabase/supabase-js";

export interface ResellerClient {
  landingId: string;
  professionalName: string | null;
  professionName: string;
  phone: string | null;
  landingStatus: string;
  createdAt: string;
  lastPaymentStatus: string | null;
}

export interface ResellerStats {
  activeClients: number;
  commissionsThisMonth: number;
  pendingBalance: number;
}

export interface PendingPayoutRequest {
  id: string;
  amount: number;
  status: string;
  requestedAt: string;
}

export interface ResellerDashboardData {
  clients: ResellerClient[];
  stats: ResellerStats;
  pendingPayoutRequest: PendingPayoutRequest | null;
  cbuAlias: string | null;
}

// Every query below runs against the caller's own RLS-scoped Supabase
// client. get_reseller_clients is a narrow SECURITY DEFINER RPC (see
// 0029_reseller_clients_rpc.sql) since resellers have no RLS SELECT access
// to landings/payments/subscriptions at all; the commissions/payout-request/
// resellers reads use plain RLS ("select own") the same as everywhere else
// in this codebase.
export async function fetchResellerDashboard(
  supabase: SupabaseClient,
  resellerId: string
): Promise<ResellerDashboardData> {
  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);

  const [
    { data: clients },
    { data: commissions },
    { data: payoutRequests },
    { data: resellerRow },
  ] = await Promise.all([
    supabase.rpc("get_reseller_clients"),
    supabase
      .from("reseller_commissions")
      .select("commission_amount, status, created_at")
      .eq("reseller_id", resellerId),
    supabase
      .from("reseller_payout_requests")
      .select("id, amount, status, requested_at")
      .eq("reseller_id", resellerId)
      .eq("status", "pending")
      .order("requested_at", { ascending: false })
      .limit(1),
    supabase.from("resellers").select("cbu_alias").eq("id", resellerId).maybeSingle(),
  ]);

  const commissionRows = commissions ?? [];
  const commissionsThisMonth = commissionRows
    .filter((c) => new Date(c.created_at) >= startOfMonth)
    .reduce((sum, c) => sum + Number(c.commission_amount), 0);
  const pendingBalance = commissionRows
    .filter((c) => c.status === "pending")
    .reduce((sum, c) => sum + Number(c.commission_amount), 0);

  const clientRows = (clients ?? []) as {
    landing_id: string;
    professional_name: string | null;
    profession_name: string;
    phone: string | null;
    landing_status: string;
    created_at: string;
    last_payment_status: string | null;
  }[];

  const activeClients = clientRows.filter((c) => c.landing_status === "active").length;

  const payoutRow = payoutRequests?.[0];

  return {
    clients: clientRows.map((c) => ({
      landingId: c.landing_id,
      professionalName: c.professional_name,
      professionName: c.profession_name,
      phone: c.phone,
      landingStatus: c.landing_status,
      createdAt: c.created_at,
      lastPaymentStatus: c.last_payment_status,
    })),
    stats: {
      activeClients,
      commissionsThisMonth,
      pendingBalance,
    },
    pendingPayoutRequest: payoutRow
      ? {
          id: payoutRow.id,
          amount: Number(payoutRow.amount),
          status: payoutRow.status,
          requestedAt: payoutRow.requested_at,
        }
      : null,
    cbuAlias: resellerRow?.cbu_alias ?? null,
  };
}
