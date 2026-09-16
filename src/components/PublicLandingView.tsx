import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { SectionConfigItem } from "@/lib/landings/update-landing";
import {
  ContadorLandingTemplate,
  type ContadorFormData,
} from "@/components/templates/contador/ContadorLandingTemplate";

const PUBLICLY_VISIBLE_STATUSES = new Set(["active"]);

// Shared by both public-landing routes: the subdomain one (site/[slug],
// reached via the proxy rewrite in proxy.ts) and the temporary path-based
// one (/[slug], used while the project doesn't have Vercel Pro's wildcard
// subdomain support yet). Both resolve a landing the same way and must stay
// in sync, so the fetch + render logic lives here once.
//
// Rendering itself is delegated to a per-profession template component
// (only "contadores" exists today) so the exact same markup/palette is used
// here and in the onboarding wizard's live preview.
export async function PublicLandingView({ slug }: { slug: string }) {
  const supabase = await createClient();

  const { data: landing } = await supabase
    .from("landings")
    .select(
      "form_data, sections_config, status, professions(slug), templates(config)"
    )
    .eq("internal_subdomain", slug)
    .maybeSingle();

  if (!landing || !PUBLICLY_VISIBLE_STATUSES.has(landing.status)) {
    notFound();
  }

  // The Supabase client here has no generated Database types, so its
  // inference for embedded to-one relations (professions/templates, joined
  // via landings.profession_id/template_id) is unreliable about whether it
  // comes back as an object or a single-element array -- normalize both.
  function one<T>(rel: T | T[] | null): T | null {
    return Array.isArray(rel) ? (rel[0] ?? null) : rel;
  }

  const professionSlug = one(
    landing.professions as { slug: string } | { slug: string }[] | null
  )?.slug;
  const templateConfig = one(
    landing.templates as
      | { config?: { primaryColor?: string } }
      | { config?: { primaryColor?: string } }[]
      | null
  );
  const sectionsConfig = landing.sections_config as SectionConfigItem[];

  if (professionSlug === "contadores") {
    return (
      <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col">
        <ContadorLandingTemplate
          formData={landing.form_data as ContadorFormData}
          sectionsConfig={sectionsConfig}
          accentColor={templateConfig?.config?.primaryColor}
        />
      </div>
    );
  }

  notFound();
}
