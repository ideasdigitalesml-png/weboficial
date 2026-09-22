import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { SectionConfigItem } from "@/lib/landings/update-landing";
import {
  ContadorLandingTemplate,
  type ContadorFormData,
} from "@/components/templates/contador/ContadorLandingTemplate";
import { ContadorModernoTemplate } from "@/components/templates/contador/ContadorModernoTemplate";
import { ContadorClasicoTemplate } from "@/components/templates/contador/ContadorClasicoTemplate";
import { ContadorMinimalTemplate } from "@/components/templates/contador/ContadorMinimalTemplate";
import {
  AbogadoModernoTemplate,
  type AbogadoFormData,
} from "@/components/templates/abogado/AbogadoModernoTemplate";
import { AbogadoClasicoTemplate } from "@/components/templates/abogado/AbogadoClasicoTemplate";
import { AbogadoMinimalTemplate } from "@/components/templates/abogado/AbogadoMinimalTemplate";
import { findContadorPaleta } from "@/lib/templates/contador-paletas";
import { findAbogadoPaleta } from "@/lib/templates/abogado-paletas";

const PUBLICLY_VISIBLE_STATUSES = new Set(["active", "draft"]);

interface TemplateConfig {
  primaryColor?: string;
  secondaryColor?: string;
  layout?: string;
}

// Shared by both public-landing routes' generateMetadata (site/[slug] and
// the temporary path-based /[slug]) so their Open Graph tags stay in sync
// with the same resolution rules PublicLandingView itself uses -- a
// non-active landing gets no dynamic meta, same as it gets notFound() below.
export async function getPublicLandingMeta(
  slug: string
): Promise<{ name: string; description?: string } | null> {
  const supabase = await createClient();

  const { data: landing } = await supabase
    .from("landings")
    .select("form_data, status")
    .eq("internal_subdomain", slug)
    .maybeSingle();

  if (!landing || !PUBLICLY_VISIBLE_STATUSES.has(landing.status)) {
    return null;
  }

  const formData = landing.form_data as { name?: string; description?: string };
  if (!formData?.name) {
    return null;
  }

  return { name: formData.name, description: formData.description };
}

// Shared by both public-landing routes: the subdomain one (site/[slug],
// reached via the proxy rewrite in proxy.ts) and the temporary path-based
// one (/[slug], used while the project doesn't have Vercel Pro's wildcard
// subdomain support yet). Both resolve a landing the same way and must stay
// in sync, so the fetch + render logic lives here once.
//
// Rendering itself is delegated to a per-profession, per-template-layout
// component so the exact same markup/palette is used here and in each
// profession's onboarding wizard live preview.
export async function PublicLandingView({ slug }: { slug: string }) {
  const supabase = await createClient();

  const { data: landing } = await supabase
    .from("landings")
    .select(
      "slug, form_data, sections_config, status, paleta_id, professions(slug), templates(config)"
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
  const templateRow = one(
    landing.templates as
      | { config?: TemplateConfig }
      | { config?: TemplateConfig }[]
      | null
  );
  const templateConfig = templateRow?.config;
  const sectionsConfig = landing.sections_config as SectionConfigItem[];

  if (professionSlug === "abogados") {
    const formData = landing.form_data as AbogadoFormData;
    if (templateConfig?.layout === "clasico") {
      return (
        <AbogadoClasicoTemplate
          formData={formData}
          sectionsConfig={sectionsConfig}
          subdomain={landing.slug}
          colorPrimary={templateConfig.primaryColor}
          colorAccent={templateConfig.secondaryColor}
        />
      );
    }
    if (templateConfig?.layout === "modern") {
      return (
        <AbogadoModernoTemplate
          formData={formData}
          sectionsConfig={sectionsConfig}
          subdomain={landing.slug}
          colorPrimary={templateConfig.primaryColor}
          colorAccent={templateConfig.secondaryColor}
          paletteVariables={findAbogadoPaleta(landing.paleta_id).variables}
        />
      );
    }
    return (
      <AbogadoMinimalTemplate
        formData={formData}
        sectionsConfig={sectionsConfig}
        subdomain={landing.slug}
        colorPrimary={templateConfig?.primaryColor}
      />
    );
  }

  if (professionSlug !== "contadores") {
    notFound();
  }

  if (templateConfig?.layout === "modern") {
    return (
      <ContadorModernoTemplate
        formData={landing.form_data as ContadorFormData}
        sectionsConfig={sectionsConfig}
        subdomain={landing.slug}
        colorPrimary={templateConfig.primaryColor}
        colorAccent={templateConfig.secondaryColor}
        paletteVariables={findContadorPaleta(landing.paleta_id).variables}
      />
    );
  }

  if (templateConfig?.layout === "classic") {
    return (
      <ContadorClasicoTemplate
        formData={landing.form_data as ContadorFormData}
        sectionsConfig={sectionsConfig}
        subdomain={landing.slug}
        colorPrimary={templateConfig.primaryColor}
        colorAccent={templateConfig.secondaryColor}
      />
    );
  }

  if (templateConfig?.layout === "minimal") {
    return (
      <ContadorMinimalTemplate
        formData={landing.form_data as ContadorFormData}
        sectionsConfig={sectionsConfig}
        subdomain={landing.slug}
        colorPrimary={templateConfig.primaryColor}
      />
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col">
      <ContadorLandingTemplate
        formData={landing.form_data as ContadorFormData}
        sectionsConfig={sectionsConfig}
        accentColor={templateConfig?.primaryColor}
      />
    </div>
  );
}
