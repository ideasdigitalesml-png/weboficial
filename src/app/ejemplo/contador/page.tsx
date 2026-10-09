import type { Metadata } from "next";
import {
  renderLandingByTemplate,
  type LandingRenderData,
} from "@/components/PublicLandingView";
import { DEFAULT_SECTIONS_CONFIG } from "@/lib/landings/create-landing";
import { CONTADOR_DEMO_PROFILE } from "@/lib/demo-profiles";
import { buildTurnosBookingData } from "@/lib/turnos/booking-data";
import { DEFAULT_TURNOS_CONFIG } from "@/lib/turnos/types";

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

// Matches the "bosque" paleta (CONTADOR_PALETAS default) so the demo
// turnos section's colors match what the template above it actually shows.
const TEMPLATE_CONFIG = { layout: "modern", primaryColor: "#0B2545", secondaryColor: "#1A6B4A" };

export default async function EjemploContadorPage() {
  const turnosData = await buildTurnosBookingData(
    { ...DEFAULT_TURNOS_CONFIG, enabled: true },
    CONTADOR_DEMO_PROFILE,
    "contadores",
    TEMPLATE_CONFIG,
    "/onboarding"
  );

  return renderLandingByTemplate(
    LANDING,
    "contadores",
    TEMPLATE_CONFIG,
    "/onboarding",
    turnosData
  );
}
