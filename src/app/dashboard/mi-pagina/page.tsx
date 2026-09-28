import { redirect } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { createClient } from "@/lib/supabase/server";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { CONTADOR_PALETAS } from "@/lib/templates/contador-paletas";
import { ABOGADO_PALETAS } from "@/lib/templates/abogado-paletas";
import { PaletteEditor } from "../PaletteEditor";

// Kept in sync with OnboardingWizard.tsx's map of the same name.
const TEMPLATE_PREVIEW_IMAGE: Record<string, string> = {
  "contadores:moderno": "/previews/contador-moderno.jpg",
  "contadores:clasico": "/previews/contador-clasico.jpg",
  "contadores:minimal": "/previews/contador-minimal.jpg",
  "abogados:moderno": "/previews/abogado-moderno.jpg",
  "abogados:clasico": "/previews/abogado-clasico.jpg",
  "abogados:minimal": "/previews/abogado-minimal.jpg",
  "psicologos:moderno": "/previews/psicologo-moderno.jpg",
  "psicologos:clasico": "/previews/psicologo-clasico.jpg",
  "psicologos:minimal": "/previews/psicologo-minimal.jpg",
};

const PALETAS_BY_PROFESSION: Record<string, typeof CONTADOR_PALETAS> = {
  contadores: CONTADOR_PALETAS,
  abogados: ABOGADO_PALETAS,
};

export default async function MiPaginaPage({
  searchParams,
}: {
  searchParams: Promise<{ plantilla?: string }>;
}) {
  const { plantilla } = await searchParams;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: landing } = await supabase
    .from("landings")
    .select("id, profession_id, template_id, paleta_id")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!landing) {
    redirect("/onboarding");
  }

  const [{ data: profession }, { data: template }] = await Promise.all([
    supabase
      .from("professions")
      .select("name, slug")
      .eq("id", landing.profession_id)
      .maybeSingle(),
    supabase
      .from("templates")
      .select("name, slug, preview_image_url, config")
      .eq("id", landing.template_id)
      .maybeSingle(),
  ]);

  const templateConfig = template?.config as { layout?: string } | undefined;
  const isModerno = templateConfig?.layout === "modern";
  const localPreviewImage = profession?.slug && template?.slug
    ? TEMPLATE_PREVIEW_IMAGE[`${profession.slug}:${template.slug}`]
    : undefined;
  const paletas = profession?.slug ? PALETAS_BY_PROFESSION[profession.slug] : undefined;

  return (
    <DashboardShell>
      <div className="mx-auto flex w-full max-w-[900px] flex-1 flex-col gap-6 px-5 py-6 sm:gap-8 sm:px-6 sm:py-10">
        <h1 className="text-xl font-semibold text-navy sm:text-2xl">Mi página</h1>

        {plantilla === "1" && (
          <div className="rounded-xl border border-sky/30 bg-sky/5 px-5 py-4 text-sm font-medium text-navy">
            ¡Plantilla actualizada! Tu página ya muestra el nuevo diseño.
          </div>
        )}

        {/* Mi plantilla */}
        <section className="flex flex-col gap-3">
          <h2 className="text-lg font-semibold text-navy">Mi plantilla</h2>
          <div className="flex flex-col gap-3 rounded-xl border border-border-subtle p-4 sm:flex-row sm:items-center">
            {(localPreviewImage || template?.preview_image_url) && (
              <Image
                src={localPreviewImage ?? template!.preview_image_url!}
                alt={template?.name ?? "Plantilla"}
                width={160}
                height={107}
                className="h-auto w-full max-w-40 rounded-lg border border-border-subtle object-cover object-top"
                unoptimized
              />
            )}
            <div className="flex flex-1 flex-col gap-2">
              <p className="text-sm font-medium text-navy">{template?.name ?? "—"}</p>
              <p className="text-sm text-text-body">Tu plantilla activa.</p>
              <div className="flex flex-wrap gap-2">
                <Link
                  href="/dashboard/editar"
                  className="inline-flex w-fit items-center justify-center rounded-full border border-border-subtle px-4 py-2 text-sm font-medium text-navy transition-colors hover:border-navy/40"
                >
                  Editar contenido
                </Link>
                <Link
                  href="/dashboard/cambiar-plantilla"
                  className="inline-flex w-fit items-center justify-center rounded-full border border-border-subtle px-4 py-2 text-sm font-medium text-navy transition-colors hover:border-navy/40"
                >
                  Cambiar plantilla
                </Link>
                <a
                  href="/dashboard/preview"
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex w-fit items-center justify-center gap-1.5 rounded-full border border-border-subtle px-4 py-2 text-sm font-medium text-navy transition-colors hover:border-navy/40"
                >
                  👁️ Ver mi página
                </a>
              </div>
            </div>
          </div>
        </section>

        {/* Personalización — Paleta de colores */}
        {isModerno && paletas ? (
          <section>
            <PaletteEditor
              landingId={landing.id}
              paletas={paletas}
              initialPaletaId={landing.paleta_id ?? "bosque"}
            />
          </section>
        ) : (
          <section className="flex flex-col gap-2">
            <h2 className="text-lg font-semibold text-navy">Personalización</h2>
            <p className="text-sm text-text-body">
              La personalización de colores está disponible próximamente para
              tu plantilla.
            </p>
          </section>
        )}
      </div>
    </DashboardShell>
  );
}
