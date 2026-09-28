import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { DashboardShell } from "@/components/dashboard/DashboardShell";

const SUPPORT_EMAIL = "ideasdigitalesml@gmail.com";

// Left empty until support agrees on a dedicated WhatsApp line -- the
// WhatsApp button below only renders once this has a real number (E.164,
// digits only, e.g. "5491112345678"). Until then, email is the only
// contact channel shown.
const SUPPORT_WHATSAPP_NUMBER = "";

export default async function AyudaPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  return (
    <DashboardShell>
      <div className="mx-auto flex w-full max-w-[900px] flex-1 flex-col gap-6 px-5 py-6 sm:gap-8 sm:px-6 sm:py-10">
        <h1 className="text-xl font-semibold text-navy sm:text-2xl">Centro de ayuda</h1>
        <p className="text-sm text-text-body">
          ¿Tenés una duda o un problema con tu página? Escribinos por el medio que prefieras.
        </p>

        <section className="flex flex-col gap-3">
          <a
            href={`mailto:${SUPPORT_EMAIL}`}
            className="inline-flex min-h-[52px] w-fit items-center justify-center gap-2 rounded-full border border-border-subtle px-5 text-base font-medium text-navy transition-colors hover:border-navy/40"
          >
            Escribinos a {SUPPORT_EMAIL}
          </a>
          {SUPPORT_WHATSAPP_NUMBER && (
            <a
              href={`https://wa.me/${SUPPORT_WHATSAPP_NUMBER}`}
              target="_blank"
              rel="noreferrer"
              className="inline-flex min-h-[52px] w-fit items-center justify-center gap-2 rounded-full bg-sky px-5 text-base font-semibold text-white transition-colors hover:bg-sky-dark"
            >
              Escribinos por WhatsApp
            </a>
          )}
        </section>
      </div>
    </DashboardShell>
  );
}
