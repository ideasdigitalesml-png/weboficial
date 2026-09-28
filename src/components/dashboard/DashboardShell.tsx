import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ROOT_DOMAIN } from "@/lib/root-domain";
import { DashboardNav } from "./DashboardNav";

// Wraps every "real" dashboard section (Inicio, Mi página, Mi dominio, Mi
// suscripción, Mi cuenta, Ayuda, and their sub-pages like editar/plan/
// cancelar/cambiar-plantilla) with the persistent nav. Deliberately NOT used
// by /dashboard/preview or the two processing pollers
// (/dashboard/processing, /dashboard/dominio/processing) -- those are
// full-screen states on purpose (preview must look identical to the real
// published page; the pollers are a focused waiting screen), so they keep
// rendering without this chrome, same as before this reorg.
//
// Does its own small user/landing/custom_domain fetch for the nav's own
// display (URL, active/pending badge) -- independent of whatever the page
// using this shell fetches for its own content, same "each page fetches
// what it needs" pattern the rest of this app already follows.
export async function DashboardShell({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect("/login");
  }

  const { data: landing } = await supabase
    .from("landings")
    .select("id, slug, status")
    .eq("user_id", user.id)
    .maybeSingle();
  if (!landing) {
    redirect("/onboarding");
  }

  const { data: customDomain } = await supabase
    .from("custom_domains")
    .select("domain")
    .eq("landing_id", landing.id)
    .eq("status", "active")
    .maybeSingle();

  const isActive = landing.status === "active";
  const publicUrl = customDomain
    ? `https://${customDomain.domain}`
    : isActive && landing.slug
      ? `https://${landing.slug}.${ROOT_DOMAIN}`
      : null;

  return (
    <div className="flex min-h-screen flex-col md:flex-row">
      <DashboardNav publicUrl={publicUrl} isActive={isActive} />
      <main className="flex flex-1 flex-col">{children}</main>
    </div>
  );
}
