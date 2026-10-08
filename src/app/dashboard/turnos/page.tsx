import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { sanitizeTurnosConfig } from "@/lib/turnos/types";
import { TurnosPageClient } from "./TurnosPageClient";

export default async function DashboardTurnosPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: landing } = await supabase
    .from("landings")
    .select("id, turnos_config")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!landing) {
    redirect("/onboarding");
  }

  return (
    <DashboardShell>
      <div className="mx-auto flex w-full max-w-[700px] flex-1 flex-col gap-6 px-5 py-6 sm:gap-8 sm:px-6 sm:py-10">
        <div>
          <h1 className="text-xl font-semibold text-navy sm:text-2xl">Mis turnos</h1>
          <p className="mt-1 text-sm text-text-body">
            Configurá cuándo tus clientes pueden pedirte un turno. Ellos eligen día y horario y te
            escriben por WhatsApp -- vos confirmás ahí.
          </p>
        </div>
        <TurnosPageClient
          landingId={landing.id}
          initialConfig={sanitizeTurnosConfig(landing.turnos_config)}
        />
      </div>
    </DashboardShell>
  );
}
