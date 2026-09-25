import { formatListWithAnd } from "@/lib/format-list";
import { psicologoTitle, type Genero } from "@/lib/gendered-title";

export interface PsicologoTextTemplateData {
  nombre: string;
  titulo: string;
  matricula: string;
  enfoque?: string;
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
  especialidades,
  genero,
}: PsicologoTextTemplateData): string {
  const displayTitle = titulo || psicologoTitle(genero);
  const especialidadesText =
    especialidades.length > 0
      ? ` Me especializo en ${formatListWithAnd(especialidades)}.`
      : "";
  const enfoqueText = enfoque
    ? ` Trabajo desde un enfoque ${enfoque.toLowerCase()}.`
    : "";
  return `Soy ${nombre}, ${displayTitle} (matrícula ${matricula}).${especialidadesText}${enfoqueText} Te acompaño en un espacio de confianza y respeto, adaptando el proceso a tus necesidades.`;
}
