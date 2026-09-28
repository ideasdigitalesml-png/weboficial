import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { DashboardShell } from "@/components/dashboard/DashboardShell";

export default async function CuentaPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("created_at")
    .eq("id", user.id)
    .maybeSingle();

  const memberSince = profile?.created_at
    ? new Date(profile.created_at).toLocaleDateString("es-AR", {
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    : null;

  return (
    <DashboardShell>
      <div className="mx-auto flex w-full max-w-[900px] flex-1 flex-col gap-6 px-5 py-6 sm:gap-8 sm:px-6 sm:py-10">
        <h1 className="text-xl font-semibold text-navy sm:text-2xl">Mi cuenta</h1>

        <section className="flex flex-col gap-4 rounded-xl border border-border-subtle p-4">
          <div>
            <p className="text-sm text-text-body">Email</p>
            <p className="text-base font-medium text-navy">{user.email}</p>
          </div>
          {memberSince && (
            <div>
              <p className="text-sm text-text-body">Miembro desde</p>
              <p className="text-base font-medium text-navy">{memberSince}</p>
            </div>
          )}
        </section>

        <form action="/auth/signout" method="post">
          <button
            type="submit"
            className="inline-flex min-h-11 items-center justify-center rounded-full border border-border-subtle px-5 text-sm font-medium text-navy transition-colors hover:border-navy/40"
          >
            Cerrar sesión
          </button>
        </form>
      </div>
    </DashboardShell>
  );
}
