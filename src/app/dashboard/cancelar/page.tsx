import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { CancelButton } from "./CancelButton";

export default async function CancelarSuscripcionPage() {
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

  // No dedicated "next billing date" column exists yet -- the plan is
  // strictly monthly, so the current period's end is approximated as one
  // month after the subscription's anchor date (created_at).
  const anchor = subscription ? new Date(subscription.created_at) : new Date();
  const periodEnd = new Date(anchor);
  periodEnd.setMonth(periodEnd.getMonth() + 1);
  const periodEndLabel = periodEnd.toLocaleDateString("es-AR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return (
    <>
      <DashboardHeader email={user.email ?? ""} />
      <div className="mx-auto flex w-full max-w-[900px] flex-1 flex-col gap-6 px-6 py-10">
        <h1 className="text-2xl font-semibold text-navy">Cancelar suscripción</h1>
        <p className="text-text-body">
          Al cancelar, tu página permanece activa hasta el{" "}
          <strong>{periodEndLabel}</strong>. Después deja de estar disponible
          públicamente. No hay cargos adicionales ni penalidades.
        </p>
        <div className="flex flex-wrap gap-3">
          <CancelButton />
          <Link
            href="/dashboard"
            className="inline-flex min-h-11 items-center justify-center rounded-full border border-border-subtle px-6 text-sm font-medium text-navy transition-colors hover:border-navy/40"
          >
            Volver sin cancelar
          </Link>
        </div>
      </div>
    </>
  );
}
