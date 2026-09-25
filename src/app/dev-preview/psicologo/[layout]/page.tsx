import { notFound } from "next/navigation";
import { DEFAULT_SECTIONS_CONFIG } from "@/lib/landings/create-landing";
import { PsicologoModernoTemplate } from "@/components/templates/psicologo/PsicologoModernoTemplate";
import { PsicologoClasicoTemplate } from "@/components/templates/psicologo/PsicologoClasicoTemplate";
import { PsicologoMinimalTemplate } from "@/components/templates/psicologo/PsicologoMinimalTemplate";
import { PSICOLOGO_PREVIEW_DATA, PSICOLOGO_PREVIEW_COLORS } from "../sample-data";

// Dev-only tooling route, 404s in production (see the guard below) --
// scripts/generate-component-previews.js drives a real `next dev` server to
// this route and screenshots it, because PsicologoModernoTemplate/
// ClasicoTemplate/MinimalTemplate use next/font (Playfair Display, Inter)
// and Tailwind, neither of which renders faithfully outside Next's own
// pipeline. psicologos has no raw-HTML template source under /templates/
// (unlike abogado/contador), so it can't use generate-previews.js's
// fillPlaceholders+setContent method -- this is the only faithful way to
// (re)generate its preview thumbnails, same reasoning as how
// contador-clasico/minimal's screenshots were originally captured from a
// live component render.
export default async function PsicologoPreviewPage({
  params,
}: {
  params: Promise<{ layout: string }>;
}) {
  if (process.env.NODE_ENV === "production") {
    notFound();
  }

  const { layout } = await params;
  const colors = PSICOLOGO_PREVIEW_COLORS[layout];
  if (!colors) {
    notFound();
  }

  const props = {
    formData: PSICOLOGO_PREVIEW_DATA,
    sectionsConfig: DEFAULT_SECTIONS_CONFIG,
    subdomain: "vista-previa",
    colorPrimary: colors.primary,
    colorAccent: colors.accent,
  };

  if (layout === "moderno") return <PsicologoModernoTemplate {...props} />;
  if (layout === "clasico") return <PsicologoClasicoTemplate {...props} />;
  if (layout === "minimal") return <PsicologoMinimalTemplate {...props} />;

  notFound();
}
