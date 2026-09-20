import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";

export default async function PlanPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  return (
    <>
      <DashboardHeader email={user.email ?? ""} />
      <div className="mx-auto flex w-full max-w-[900px] flex-1 flex-col items-center justify-center gap-4 px-6 py-20 text-center">
        <h1 className="text-2xl font-semibold text-navy">Actualizar plan</h1>
        <p className="text-text-body">
          Próximamente vas a poder ver y cambiar tu plan desde acá.
        </p>
        <Link
          href="/dashboard"
          className="rounded-full border border-border-subtle px-5 py-2 text-sm font-medium text-navy transition-colors hover:border-navy/40"
        >
          Volver al dashboard
        </Link>
      </div>
    </>
  );
}
