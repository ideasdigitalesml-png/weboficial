import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { DashboardShell } from "@/components/dashboard/DashboardShell";

const SUBSCRIPTION_STATUS_LABELS: Record<string, string> = {
  pending: "Pendiente",
  authorized: "Activa",
  paused: "Pausada",
  cancelled: "Cancelada",
};

// Green/yellow/red at a glance, matching the same badge treatment as the
// landing status pill elsewhere in the dashboard -- "none" is the
// no-subscription (Plan Gratuito) case.
const SUBSCRIPTION_STATUS_BADGE: Record<string, string> = {
  authorized: "bg-emerald-100 text-emerald-700",
  pending: "bg-amber-100 text-amber-700",
  paused: "bg-amber-100 text-amber-700",
  cancelled: "bg-red-100 text-red-700",
  none: "bg-slate-100 text-slate-600",
};

export default async function SuscripcionPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: landing } = await supabase
    .from("landings")
    .select("id")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!landing) {
    redirect("/onboarding");
  }

  const { data: subscription } = await supabase
    .from("subscriptions")
    .select("status, created_at")
    .eq("landing_id", landing.id)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  return (
    <DashboardShell>
      <div className="mx-auto flex w-full max-w-[900px] flex-1 flex-col gap-6 px-5 py-6 sm:gap-8 sm:px-6 sm:py-10">
        <h1 className="text-xl font-semibold text-navy sm:text-2xl">Mi suscripción</h1>

        <section className="flex flex-col gap-3 rounded-xl border border-border-subtle p-4 sm:flex-row sm:items-center sm:justify-between">
          <span
            className={`inline-flex w-fit items-center rounded-full px-3 py-1 text-xs font-semibold ${
              SUBSCRIPTION_STATUS_BADGE[subscription?.status ?? "none"]
            }`}
          >
            {subscription
              ? (SUBSCRIPTION_STATUS_LABELS[subscription.status] ?? subscription.status)
              : "Plan Gratuito"}
          </span>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Link
              href="/dashboard/plan"
              className="inline-flex min-h-11 items-center justify-center rounded-full border border-border-subtle px-4 text-sm font-medium text-navy transition-colors hover:border-navy/40"
            >
              Actualizar plan
            </Link>
            {subscription && (
              <Link
                href="/dashboard/cancelar"
                className="inline-flex min-h-11 items-center justify-center rounded-full px-4 text-sm font-medium text-red-600 transition-colors hover:bg-red-50"
              >
                Cancelar suscripción
              </Link>
            )}
          </div>
        </section>
      </div>
    </DashboardShell>
  );
}
