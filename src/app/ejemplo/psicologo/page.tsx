import type { Metadata } from "next";
import {
  renderLandingByTemplate,
  type LandingRenderData,
} from "@/components/PublicLandingView";
import { DEFAULT_SECTIONS_CONFIG } from "@/lib/landings/create-landing";
import { PSICOLOGO_DEMO_PROFILE } from "@/lib/demo-profiles";
import { buildTurnosBookingData } from "@/lib/turnos/booking-data";
import { DEFAULT_TURNOS_CONFIG } from "@/lib/turnos/types";

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

// Matches PsicologoModernoTemplate's own DEFAULT_PRIMARY/DEFAULT_ACCENT.
const TEMPLATE_CONFIG = { primaryColor: "#6b7f6b", secondaryColor: "#6b7f6b" };

export default async function EjemploPsicologoPage() {
  const turnosData = await buildTurnosBookingData(
    { ...DEFAULT_TURNOS_CONFIG, enabled: true },
    PSICOLOGO_DEMO_PROFILE,
    "psicologos",
    TEMPLATE_CONFIG,
    "/onboarding"
  );

  return renderLandingByTemplate(
    LANDING,
    "psicologos",
    undefined,
    "/onboarding",
    turnosData
  );
}
