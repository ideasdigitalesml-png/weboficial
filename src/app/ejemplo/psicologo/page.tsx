import type { Metadata } from "next";
import {
  renderLandingByTemplate,
  type LandingRenderData,
} from "@/components/PublicLandingView";
import { DEFAULT_SECTIONS_CONFIG } from "@/lib/landings/create-landing";
import { PSICOLOGO_DEMO_PROFILE } from "@/lib/demo-profiles";

export const metadata: Metadata = {
  title: "Ejemplo de página para psicólogos — weboficial.com.ar",
  robots: { index: false, follow: false },
};

const LANDING: LandingRenderData = {
  slug: "julietamarchetti",
  formData: PSICOLOGO_DEMO_PROFILE,
  sectionsConfig: DEFAULT_SECTIONS_CONFIG,
  paletaId: null,
};

export default function EjemploPsicologoPage() {
  return renderLandingByTemplate(
    LANDING,
    "psicologos",
    undefined,
    "/onboarding"
  );
}
