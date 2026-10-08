import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import type { SectionConfigItem } from "@/lib/landings/update-landing";
import { oneRelation } from "@/lib/supabase/normalize-relation";
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
import {
  PsicologoModernoTemplate,
  type PsicologoFormData,
} from "@/components/templates/psicologo/PsicologoModernoTemplate";
import { PsicologoClasicoTemplate } from "@/components/templates/psicologo/PsicologoClasicoTemplate";
import { PsicologoMinimalTemplate } from "@/components/templates/psicologo/PsicologoMinimalTemplate";

// Only 'active' -- this used to also include 'draft' (a pre-payment
// preview, no login required), but 0007_remove_temporary_draft_public_read.sql
// locked landings' public SELECT RLS policy down to `status = 'active'`
// only, deliberately, to close a hole where any signed-in user could read
// any other user's still-unpaid landing. That migration was never
// backported here, so 'draft' in this set was dead code: the RLS policy
// already returns zero rows for a draft landing before this file ever runs,
// regardless of what's in this Set. Kept in sync with the DB now instead of
// silently relying on RLS to make the mismatch harmless.
const PUBLICLY_VISIBLE_STATUSES = new Set(["active"]);

export interface TemplateConfig {
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
): Promise<{
  name: string;
  description?: string;
  customDomain: string | null;
  professionSlug: string | null;
} | null> {
  const supabase = await createClient();

  const [{ data: landing }, { data: customDomain }] = await Promise.all([
    supabase
      .from("landings")
      .select("form_data, status, professions(slug)")
      .eq("internal_subdomain", slug)
      .maybeSingle(),
    // Service-role: an anonymous visitor's RLS-scoped client can't see
    // custom_domains at all (no public SELECT policy on it -- same reason
    // proxy.ts's resolveCustomDomainSlug/resolveActiveCustomDomainForSlug
    // both use the admin client too). landings.slug === landings.internal_subdomain
    // always (set to the same value at creation, see create-landing.ts) --
    // custom_domains.slug is a denormalized copy of the former, so this is
    // comparable to `slug` directly.
    createAdminClient()
      .from("custom_domains")
      .select("domain")
      .eq("slug", slug)
      .eq("status", "active")
      .maybeSingle(),
  ]);

  if (!landing || !PUBLICLY_VISIBLE_STATUSES.has(landing.status)) {
    return null;
  }

  const formData = landing.form_data as { name?: string; description?: string };
  if (!formData?.name) {
    return null;
  }

  const profession = oneRelation(
    landing.professions as { slug: string } | { slug: string }[] | null
  );

  return {
    name: formData.name,
    description: formData.description,
    customDomain: customDomain?.domain ?? null,
    professionSlug: profession?.slug ?? null,
  };
}

export interface LandingRenderData {
  slug: string;
  formData: unknown;
  sectionsConfig: SectionConfigItem[];
  paletaId: string | null;
}

// Picks and renders the right per-profession, per-template-layout component
// for already-fetched landing data. Deliberately does no fetching and no
// status/ownership gating of its own -- every caller decides who's allowed
// to see what: PublicLandingView below enforces `status === 'active'` for
// anonymous visitors (site/[slug], /[slug]); /dashboard/preview instead
// checks the caller owns the row (via RLS) and allows any status, since
// previewing a still-unpaid draft is the whole point of that route.
//
// Returns null for a profession with no template component wired up yet
// (never happens today -- all three professions in the DB are handled below
// -- but kept as an explicit "nothing to render" signal rather than a thrown
// error, since only PublicLandingView's notFound() semantics are correct
// for the anonymous-visitor case; /dashboard/preview reacts to null with
// its own message instead).
export function renderLandingByTemplate(
  landing: LandingRenderData,
  professionSlug: string | undefined,
  templateConfig: TemplateConfig | undefined,
  // Only set by /ejemplo/* demo pages, to send every WhatsApp CTA to
  // "Crear mi página" instead of the demo profile's fake number. undefined
  // (the default) for every real landing -- see FloatingWhatsappButton.
  ctaHref?: string
) {
  if (professionSlug === "abogados") {
    const formData = landing.formData as AbogadoFormData;
    if (templateConfig?.layout === "clasico") {
      return (
        <AbogadoClasicoTemplate
          formData={formData}
          sectionsConfig={landing.sectionsConfig}
          subdomain={landing.slug}
          colorPrimary={templateConfig.primaryColor}
          colorAccent={templateConfig.secondaryColor}
          ctaHref={ctaHref}
        />
      );
    }
    if (templateConfig?.layout === "modern") {
      return (
        <AbogadoModernoTemplate
          formData={formData}
          sectionsConfig={landing.sectionsConfig}
          subdomain={landing.slug}
          colorPrimary={templateConfig.primaryColor}
          colorAccent={templateConfig.secondaryColor}
          paletteVariables={findAbogadoPaleta(landing.paletaId).variables}
          ctaHref={ctaHref}
        />
      );
    }
    return (
      <AbogadoMinimalTemplate
        formData={formData}
        sectionsConfig={landing.sectionsConfig}
        subdomain={landing.slug}
        colorPrimary={templateConfig?.primaryColor}
        ctaHref={ctaHref}
      />
    );
  }

  if (professionSlug === "psicologos") {
    const formData = landing.formData as PsicologoFormData;
    if (templateConfig?.layout === "clasico") {
      return (
        <PsicologoClasicoTemplate
          formData={formData}
          sectionsConfig={landing.sectionsConfig}
          subdomain={landing.slug}
          colorPrimary={templateConfig.primaryColor}
          colorAccent={templateConfig.secondaryColor}
          ctaHref={ctaHref}
        />
      );
    }
    if (templateConfig?.layout === "minimal") {
      return (
        <PsicologoMinimalTemplate
          formData={formData}
          sectionsConfig={landing.sectionsConfig}
          subdomain={landing.slug}
          colorPrimary={templateConfig?.primaryColor}
          ctaHref={ctaHref}
        />
      );
    }
    return (
      <PsicologoModernoTemplate
        formData={formData}
        sectionsConfig={landing.sectionsConfig}
        subdomain={landing.slug}
        colorPrimary={templateConfig?.primaryColor}
        colorAccent={templateConfig?.secondaryColor}
        ctaHref={ctaHref}
      />
    );
  }

  if (professionSlug !== "contadores") {
    return null;
  }

  if (templateConfig?.layout === "modern") {
    return (
      <ContadorModernoTemplate
        formData={landing.formData as ContadorFormData}
        sectionsConfig={landing.sectionsConfig}
        subdomain={landing.slug}
        colorPrimary={templateConfig.primaryColor}
        colorAccent={templateConfig.secondaryColor}
        paletteVariables={findContadorPaleta(landing.paletaId).variables}
        ctaHref={ctaHref}
      />
    );
  }

  if (templateConfig?.layout === "classic") {
    return (
      <ContadorClasicoTemplate
        formData={landing.formData as ContadorFormData}
        sectionsConfig={landing.sectionsConfig}
        subdomain={landing.slug}
        colorPrimary={templateConfig.primaryColor}
        colorAccent={templateConfig.secondaryColor}
        ctaHref={ctaHref}
      />
    );
  }

  if (templateConfig?.layout === "minimal") {
    return (
      <ContadorMinimalTemplate
        formData={landing.formData as ContadorFormData}
        sectionsConfig={landing.sectionsConfig}
        subdomain={landing.slug}
        colorPrimary={templateConfig.primaryColor}
        ctaHref={ctaHref}
      />
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col">
      <ContadorLandingTemplate
        formData={landing.formData as ContadorFormData}
        sectionsConfig={landing.sectionsConfig}
        accentColor={templateConfig?.primaryColor}
        ctaHref={ctaHref}
      />
    </div>
  );
}

// Shared by both public-landing routes: the subdomain one (site/[slug],
// reached via the proxy rewrite in proxy.ts) and the temporary path-based
// one (/[slug], used while the project doesn't have Vercel Pro's wildcard
// subdomain support yet). Both resolve a landing the same way and must stay
// in sync, so the fetch + status gate lives here once; the actual per-
// template rendering is delegated to renderLandingByTemplate above so
// /dashboard/preview can reuse it under a completely different gate (owns
// the row vs. status === 'active').
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
    notFound();
  }

  return rendered;
}
