import { formatListWithAnd } from "@/lib/format-list";
import { psicologoTitle, type Genero } from "@/lib/gendered-title";

// enfoque_terapeutico moved from free text to a fixed `select` (migration
// 0031) -- form_data now stores one of these keys, never the human label
// directly. Shared by the wizard's suggested-bio text and every template's
// display, so the mapping can't drift between them.
export const ENFOQUE_TERAPEUTICO_LABELS: Record<string, string> = {
  cognitivo_conductual: "Cognitivo-Conductual",
  psicoanalitica: "Psicoanalítica",
  sistemica: "Sistémica",
  gestalt: "Gestalt",
  integrativa: "Integrativa",
  otra: "Otra",
};

// Resolves the human-readable corriente terapéutica for both the suggested
// bio text and every template's display. When `enfoque` is "otra" the fixed
// label ("Otra") is never shown -- the professional's own free-text
// enfoqueCustom takes its place, or nothing renders at all if that's blank.
export function resolveEnfoqueLabel(enfoque?: string, enfoqueCustom?: string): string {
  if (!enfoque) return "";
  if (enfoque === "otra") return (enfoqueCustom ?? "").trim();
  return ENFOQUE_TERAPEUTICO_LABELS[enfoque] ?? enfoque;
}

// precio_consulta's "$" prefix is a render-time-only adornment (see
// FieldInput's `prefix` support) -- never stored. Strips any "$" a user may
// already have typed (old data, or pasted) before re-adding exactly one.
export function formatPrecioConsulta(value?: string): string {
  const cleaned = (value ?? "").trim().replace(/^\$+\s*/, "");
  return cleaned ? `$${cleaned}` : "";
}

export interface PsicologoTextTemplateData {
  nombre: string;
  titulo: string;
  matricula: string;
  enfoque?: string;
  enfoqueCustom?: string;
  especialidades: string[];
  genero?: Genero;
}

// Single suggested-text option, same rationale as abogados/contadores.ts:
// keep the "sobre mí" step to one decision (sugerido vs. propio), not two.
// `titulo` is a free-text field the professional writes themselves (e.g.
// "Lic. en Psicología") and normally already carries whatever gendered
// title they prefer -- genero only kicks in as a fallback for the rare case
// it's left blank, so the sentence never renders "Soy Juan, (matrícula...)".
export function getSuggestedPsicologoText({
  nombre,
  titulo,
  matricula,
  enfoque,
  enfoqueCustom,
  especialidades,
  genero,
}: PsicologoTextTemplateData): string {
  const displayTitle = titulo || psicologoTitle(genero);
  const especialidadesText =
    especialidades.length > 0
      ? ` Me especializo en ${formatListWithAnd(especialidades)}.`
      : "";
  const enfoqueLabel = resolveEnfoqueLabel(enfoque, enfoqueCustom);
  const enfoqueText = enfoqueLabel
    ? ` Trabajo desde un enfoque ${enfoqueLabel.toLowerCase()}.`
    : "";
  return `Soy ${nombre}, ${displayTitle} (matrícula ${matricula}).${especialidadesText}${enfoqueText} Te acompaño en un espacio de confianza y respeto, adaptando el proceso a tus necesidades.`;
}
