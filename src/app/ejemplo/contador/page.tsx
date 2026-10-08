import type { Metadata } from "next";
import {
  renderLandingByTemplate,
  type LandingRenderData,
} from "@/components/PublicLandingView";
import { DEFAULT_SECTIONS_CONFIG } from "@/lib/landings/create-landing";
import { CONTADOR_DEMO_PROFILE } from "@/lib/demo-profiles";

export const metadata: Metadata = {
  title: "Ejemplo de página para contadores — weboficial.com.ar",
  robots: { index: false, follow: false },
};

const LANDING: LandingRenderData = {
  slug: "diegolertora",
  formData: CONTADOR_DEMO_PROFILE,
  sectionsConfig: DEFAULT_SECTIONS_CONFIG,
  paletaId: null,
};

export default function EjemploContadorPage() {
  return renderLandingByTemplate(
    LANDING,
    "contadores",
    { layout: "modern" },
    "/onboarding"
  );
}
