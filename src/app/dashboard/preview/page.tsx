import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { SectionConfigItem } from "@/lib/landings/update-landing";
import { oneRelation } from "@/lib/supabase/normalize-relation";
import {
  renderLandingByTemplate,
  type TemplateConfig,
} from "@/components/PublicLandingView";

// Authenticated preview of the caller's own landing, at any status (draft,
// pending payment, active) -- unlike PublicLandingView (site/[slug],
// /[slug]), which only ever shows an 'active' landing to an anonymous
// visitor. Fetched via the caller's own RLS-scoped client (landings_select_own
// already allows the owner to read their row regardless of status), never
// service-role, and scoped to `user_id = auth.uid()` rather than a
// client-supplied slug -- there is no way to reach anyone else's landing
// through this route. Renders exactly what renderLandingByTemplate produces,
// no dashboard chrome, so this looks identical to the real published page.
export default async function DashboardPreviewPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: landing } = await supabase
    .from("landings")
    .select("slug, form_data, sections_config, paleta_id, professions(slug), templates(config)")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!landing) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-4 px-6 py-20 text-center">
        <p className="text-text-body">Todavía no tenés una página creada.</p>
        <Link
          href="/dashboard"
          className="rounded-full border border-border-subtle px-5 py-2 text-sm font-medium text-navy transition-colors hover:border-navy/40"
        >
          Volver al dashboard
        </Link>
      </div>
    );
  }

  const professionSlug = oneRelation(
    landing.professions as { slug: string } | { slug: string }[] | null
  )?.slug;
  const templateConfig = oneRelation(
    landing.templates as
      | { config?: TemplateConfig }
      | { config?: TemplateConfig }[]
      | null
  )?.config;

  const rendered = renderLandingByTemplate(
    {
      slug: landing.slug,
      formData: landing.form_data,
      sectionsConfig: landing.sections_config as SectionConfigItem[],
      paletaId: landing.paleta_id,
    },
    professionSlug,
    templateConfig
  );

  if (!rendered) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-4 px-6 py-20 text-center">
        <p className="text-text-body">
          No pudimos generar la vista previa de tu página.
        </p>
      </div>
    );
  }

  return rendered;
}
