import type { Metadata } from "next";
import {
  renderLandingByTemplate,
  type LandingRenderData,
} from "@/components/PublicLandingView";
import { DEFAULT_SECTIONS_CONFIG } from "@/lib/landings/create-landing";
import { ABOGADO_DEMO_PROFILE } from "@/lib/demo-profiles";
import { buildTurnosBookingData } from "@/lib/turnos/booking-data";
import { DEFAULT_TURNOS_CONFIG } from "@/lib/turnos/types";
import { TurnosBooking } from "@/components/turnos/TurnosBooking";

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

// Matches the "dorado" paleta (ABOGADO_PALETAS default) so the demo turnos
// section's colors match what the template above it actually shows.
const TEMPLATE_CONFIG = { layout: "modern", primaryColor: "#1C1C2E", secondaryColor: "#C9A84C" };

export default async function EjemploAbogadoPage() {
  const turnosData = await buildTurnosBookingData(
    { ...DEFAULT_TURNOS_CONFIG, enabled: true },
    ABOGADO_DEMO_PROFILE,
    "abogados",
    TEMPLATE_CONFIG,
    "/onboarding"
  );

  return (
    <>
      {renderLandingByTemplate(LANDING, "abogados", TEMPLATE_CONFIG, "/onboarding")}
      <TurnosBooking data={turnosData} />
    </>
  );
}
