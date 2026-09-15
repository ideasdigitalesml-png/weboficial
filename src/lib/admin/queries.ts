import type { SupabaseClient } from "@supabase/supabase-js";

// Every query below runs against the caller's own RLS-scoped Supabase
// client, never the service-role key. For an admin, the
// `*_select_admin` policies (migrations/0006_admin_panel.sql) make these
// see every row; for anyone else they silently fall back to whatever
// their normal "own rows" policies already allow -- there is no code path
// here that widens access beyond what Postgres itself grants the caller.

export interface ProfessionalListItem {
  landingId: string;
  name: string | null;
  professionName: string;
  slug: string;
  landingStatus: string;
  subscriptionStatus: string | null;
  createdAt: string;
}

export interface AdminMetrics {
  totalSignups: number;
  activeCount: number;
  deactivatedCount: number;
  estimatedMonthlyRevenue: number;
}

export interface AdminListResult {
  metrics: AdminMetrics;
  professionals: ProfessionalListItem[];
}

export async function fetchAdminList(
  supabase: SupabaseClient
): Promise<AdminListResult> {
  const [
    { data: landings },
    { data: professions },
    { data: plans },
    { data: subscriptions },
  ] = await Promise.all([
    supabase
      .from("landings")
      .select("id, slug, status, profession_id, plan_id, form_data, created_at")
      .order("created_at", { ascending: false }),
    supabase.from("professions").select("id, name"),
    supabase.from("plans").select("id, amount"),
    supabase
      .from("subscriptions")
      .select("landing_id, status, created_at")
      .order("created_at", { ascending: false }),
  ]);

  const professionNameById = new Map(
    (professions ?? []).map((p) => [p.id, p.name as string])
  );
  const planAmountById = new Map(
    (plans ?? []).map((p) => [p.id, Number(p.amount)])
  );

  // subscriptions came back sorted desc by created_at, so the first row
  // seen per landing_id is the latest one.
  const latestSubscriptionByLanding = new Map<string, string>();
  for (const sub of subscriptions ?? []) {
    if (!latestSubscriptionByLanding.has(sub.landing_id)) {
      latestSubscriptionByLanding.set(sub.landing_id, sub.status);
    }
  }

  const rows = landings ?? [];

  const professionals: ProfessionalListItem[] = rows.map((l) => ({
    landingId: l.id,
    name: (l.form_data as { name?: string } | null)?.name ?? null,
    professionName: professionNameById.get(l.profession_id) ?? "—",
    slug: l.slug,
    landingStatus: l.status,
    subscriptionStatus: latestSubscriptionByLanding.get(l.id) ?? null,
    createdAt: l.created_at,
  }));

  const activeCount = rows.filter((l) => l.status === "active").length;
  const deactivatedCount = rows.filter((l) => l.status === "deactivated").length;
  const estimatedMonthlyRevenue = rows
    .filter((l) => l.status === "active")
    .reduce((sum, l) => sum + (planAmountById.get(l.plan_id) ?? 0), 0);

  return {
    metrics: {
      totalSignups: rows.length,
      activeCount,
      deactivatedCount,
      estimatedMonthlyRevenue,
    },
    professionals,
  };
}

export interface ProfessionalDetail {
  landing: {
    id: string;
    slug: string;
    status: string;
    createdAt: string;
    publishedAt: string | null;
    formData: Record<string, string>;
  };
  professionName: string;
  ownerEmail: string | null;
  subscriptions: {
    id: string;
    status: string;
    createdAt: string;
    updatedAt: string;
  }[];
  payments: {
    id: string;
    status: string;
    amount: number;
    currency: string;
    createdAt: string;
  }[];
}

export async function fetchProfessionalDetail(
  supabase: SupabaseClient,
  landingId: string
): Promise<ProfessionalDetail | null> {
  const { data: landing } = await supabase
    .from("landings")
    .select(
      "id, slug, status, created_at, published_at, form_data, profession_id, user_id"
    )
    .eq("id", landingId)
    .maybeSingle();

  if (!landing) {
    return null;
  }

  const [{ data: profession }, { data: profile }, { data: subscriptions }] =
    await Promise.all([
      supabase
        .from("professions")
        .select("name")
        .eq("id", landing.profession_id)
        .maybeSingle(),
      supabase
        .from("profiles")
        .select("email")
        .eq("id", landing.user_id)
        .maybeSingle(),
      supabase
        .from("subscriptions")
        .select("id, status, created_at, updated_at")
        .eq("landing_id", landingId)
        .order("created_at", { ascending: false }),
    ]);

  const subscriptionIds = (subscriptions ?? []).map((s) => s.id);
  const { data: payments } = subscriptionIds.length
    ? await supabase
        .from("payments")
        .select("id, status, amount, currency, created_at")
        .in("subscription_id", subscriptionIds)
        .order("created_at", { ascending: false })
    : { data: [] as never[] };

  return {
    landing: {
      id: landing.id,
      slug: landing.slug,
      status: landing.status,
      createdAt: landing.created_at,
      publishedAt: landing.published_at,
      formData: landing.form_data as Record<string, string>,
    },
    professionName: profession?.name ?? "—",
    ownerEmail: profile?.email ?? null,
    subscriptions: (subscriptions ?? []).map((s) => ({
      id: s.id,
      status: s.status,
      createdAt: s.created_at,
      updatedAt: s.updated_at,
    })),
    payments: (payments ?? []).map((p) => ({
      id: p.id,
      status: p.status,
      amount: Number(p.amount),
      currency: p.currency,
      createdAt: p.created_at,
    })),
  };
}
