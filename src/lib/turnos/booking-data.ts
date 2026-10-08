import { sanitizeTurnosConfig, type TurnosConfig } from "./types";
import { getArgentinaHolidaysForYears } from "./holidays";
import { buildAvailability, yearsInWindow } from "./slots";

// Every template's `config.layout` collapses to one of these three visual
// families (see normalizeVisualStyle) -- TurnosBooking uses it to vary
// typography/border radius/button shape so the booking section reads as
// part of that template instead of one generic widget bolted onto all nine.
export type TurnosVisualStyle = "moderno" | "clasico" | "minimal";

function normalizeVisualStyle(layout: string | undefined): TurnosVisualStyle {
  if (layout === "clasico" || layout === "classic") return "clasico";
  if (layout === "minimal") return "minimal";
  return "moderno";
}

export interface TurnosBookingData {
  config: TurnosConfig;
  // "YYYY-MM-DD" -> available "HH:MM" slots that day. Empty object when
  // turnos are disabled or there's no phone to message -- TurnosBooking
  // renders nothing in that case.
  availability: Record<string, string[]>;
  phone: string;
  professionalName: string;
  // false only for psicólogos -- see the feature's WhatsApp message spec.
  requireMotivo: boolean;
  primaryColor: string;
  accentColor: string;
  visualStyle: TurnosVisualStyle;
  // Only set by /ejemplo/* demo pages -- overrides the "Agendar turno por
  // WhatsApp" button's destination with this href instead of a wa.me link,
  // same reasoning as ctaHref on the templates themselves (see
  // renderLandingByTemplate): a demo profile's phone is fake, so the button
  // sends visitors to "Crear mi página" instead.
  ctaHref?: string;
}

// Single place that turns a landing's raw turnos_config + form_data into
// everything <TurnosBooking> needs to render -- used by every page that
// shows a real or example booking section (PublicLandingView,
// /dashboard/preview, /ejemplo/*), so the "disabled / no phone -> no
// availability computed" and holiday-fetch logic only exists once.
export async function buildTurnosBookingData(
  rawTurnosConfig: unknown,
  formData: unknown,
  professionSlug: string | undefined,
  templateConfig: { primaryColor?: string; secondaryColor?: string; layout?: string } | undefined,
  ctaHref?: string
): Promise<TurnosBookingData> {
  const config = sanitizeTurnosConfig(rawTurnosConfig);
  const data = (typeof formData === "object" && formData !== null ? formData : {}) as Record<
    string,
    unknown
  >;
  const phone = typeof data.phone === "string" ? data.phone : "";
  const professionalName = typeof data.name === "string" ? data.name : "";
  const primaryColor = templateConfig?.primaryColor ?? "#0B2545";
  const accentColor = templateConfig?.secondaryColor ?? primaryColor;

  let availability: Record<string, string[]> = {};
  if (config.enabled && phone) {
    const holidays = config.worksHolidays
      ? new Set<string>()
      : await getArgentinaHolidaysForYears(yearsInWindow(config.daysAhead));
    availability = buildAvailability(config, holidays);
  }

  return {
    config,
    availability,
    phone,
    professionalName,
    requireMotivo: professionSlug !== "psicologos",
    primaryColor,
    accentColor,
    visualStyle: normalizeVisualStyle(templateConfig?.layout),
    ctaHref,
  };
}
