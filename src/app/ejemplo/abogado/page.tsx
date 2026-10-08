import type { Metadata } from "next";
import {
  renderLandingByTemplate,
  type LandingRenderData,
} from "@/components/PublicLandingView";
import { DEFAULT_SECTIONS_CONFIG } from "@/lib/landings/create-landing";
import { ABOGADO_DEMO_PROFILE } from "@/lib/demo-profiles";

export const metadata: Metadata = {
  title: "Ejemplo de página para abogados — weboficial.com.ar",
  robots: { index: false, follow: false },
};

const LANDING: LandingRenderData = {
  slug: "camilaabalos",
  formData: ABOGADO_DEMO_PROFILE,
  sectionsConfig: DEFAULT_SECTIONS_CONFIG,
  paletaId: null,
};

export default function EjemploAbogadoPage() {
  return renderLandingByTemplate(
    LANDING,
    "abogados",
    { layout: "modern" },
    "/onboarding"
  );
}
