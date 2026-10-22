import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { PaySubscriptionSection } from "../PaySubscriptionSection";

const SUBSCRIPTION_STATUS_LABELS: Record<string, string> = {
  pending: "Pago pendiente",
  authorized: "Activa",
  paused: "Pausada",
  cancelled: "Cancelada",
};

// Green/yellow/red at a glance, matching the same badge treatment as the
// landing status pill elsewhere in the dashboard.
const SUBSCRIPTION_STATUS_BADGE: Record<string, string> = {
  authorized: "bg-emerald-100 text-emerald-700",
  pending: "bg-amber-100 text-amber-700",
  paused: "bg-amber-100 text-amber-700",
  cancelled: "bg-red-100 text-red-700",
};

export default async function SuscripcionPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const [{ data: landing }, { data: activePlan }] = await Promise.all([
    supabase
      .from("landings")
      .select("id, status")
      .eq("user_id", user.id)
      .maybeSingle(),
    supabase.from("plans").select("amount").eq("active", true).limit(1).maybeSingle(),
  ]);

  if (!landing) {
    redirect("/onboarding");
  }

  const { data: subscription } = await supabase
    .from("subscriptions")
    .select("id, status, created_at")
    .eq("landing_id", landing.id)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  // Only a currently-collectable subscription has a meaningful "next
  // charge" -- paused/cancelled ones don't get billed again. Approximated
  // from the most recent approved payment (one billing cycle later), or
  // the subscription's own anchor date if no payment has landed yet -- the
  // plan is strictly monthly and there's no dedicated "next billing date"
  // column, same approximation cancelar/page.tsx already uses.
  let nextChargeLabel: string | null = null;
  if (subscription?.status === "authorized") {
    const { data: lastPayment } = await supabase
      .from("payments")
      .select("created_at")
      .eq("subscription_id", subscription.id)
      .eq("status", "approved")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    const anchor = new Date(lastPayment?.created_at ?? subscription.created_at);
    const nextCharge = new Date(anchor);
    nextCharge.setMonth(nextCharge.getMonth() + 1);
    nextChargeLabel = nextCharge.toLocaleDateString("es-AR", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  }

  return (
    <DashboardShell>
      <div className="mx-auto flex w-full max-w-[900px] flex-1 flex-col gap-6 px-5 py-6 sm:gap-8 sm:px-6 sm:py-10">
        <h1 className="text-xl font-semibold text-navy sm:text-2xl">Mi suscripción</h1>

        {subscription ? (
          <section className="flex flex-col gap-4 rounded-xl border border-border-subtle p-4 sm:p-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="text-sm font-medium text-navy">
                Plan weboficial
                {activePlan && ` — $${Number(activePlan.amount).toLocaleString("es-AR")}/mes`}
              </p>
              <span
                className={`inline-flex w-fit items-center rounded-full px-3 py-1 text-xs font-semibold ${
                  SUBSCRIPTION_STATUS_BADGE[subscription.status] ?? "bg-slate-100 text-slate-600"
                }`}
              >
                {SUBSCRIPTION_STATUS_LABELS[subscription.status] ?? subscription.status}
              </span>
            </div>

            <dl className="flex flex-col gap-2 text-sm text-text-body">
              {nextChargeLabel && (
                <div className="flex justify-between gap-3">
                  <dt>Próximo cobro</dt>
                  <dd className="font-medium text-navy">{nextChargeLabel}</dd>
                </div>
              )}
              <div className="flex justify-between gap-3">
                <dt>Medio de pago</dt>
                <dd className="font-medium text-navy">Mercado Pago</dd>
              </div>
            </dl>

            {subscription.status !== "cancelled" && (
              <Link
                href="/dashboard/cancelar"
                className="inline-flex min-h-11 w-fit items-center justify-center rounded-full px-4 text-sm font-medium text-red-600 transition-colors hover:bg-red-50"
              >
                Cancelar suscripción
              </Link>
            )}
          </section>
        ) : (
          <section className="flex flex-col gap-4 rounded-xl border border-border-subtle p-4 sm:p-6">
            <div>
              <p className="text-base font-semibold text-navy">
                Tu página todavía no está activa
              </p>
              <p className="text-sm text-text-body">
                Activala para que se vea en internet.
              </p>
            </div>
            {activePlan && (
              <PaySubscriptionSection
                landingId={landing.id}
                amount={Number(activePlan.amount)}
                payerEmail={user.email ?? ""}
              />
            )}
          </section>
        )}
      </div>
    </DashboardShell>
  );
}
