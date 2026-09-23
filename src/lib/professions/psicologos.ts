import { formatListWithAnd } from "@/lib/format-list";

export interface PsicologoTextTemplateData {
  nombre: string;
  titulo: string;
  matricula: string;
  enfoque?: string;
  especialidades: string[];
}

// Single suggested-text option, same rationale as abogados/contadores.ts:
// keep the "sobre mí" step to one decision (sugerido vs. propio), not two.
export function getSuggestedPsicologoText({
  nombre,
  titulo,
  matricula,
  enfoque,
  especialidades,
}: PsicologoTextTemplateData): string {
  const especialidadesText =
    especialidades.length > 0
      ? ` Me especializo en ${formatListWithAnd(especialidades)}.`
      : "";
  const enfoqueText = enfoque
    ? ` Trabajo desde un enfoque ${enfoque.toLowerCase()}.`
    : "";
  return `Soy ${nombre}, ${titulo} (matrícula ${matricula}).${especialidadesText}${enfoqueText} Te acompaño en un espacio de confianza y respeto, adaptando el proceso a tus necesidades.`;
}
