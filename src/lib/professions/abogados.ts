import { formatListWithAnd } from "@/lib/format-list";

// Mirrors the "servicios" checkbox-group options in the abogados
// form_schema migration exactly (same value/label pairs) -- this copy is
// what the wizard UI renders, the DB copy is what the server validates
// against. `icon` is a key (not raw markup) that only the Moderno template
// resolves to an actual SVG -- Clásico uses roman numerals and Minimal uses
// plain numbers instead, so they never touch it.
export const ABOGADO_SERVICES = [
  {
    value: "familia",
    label: "Derecho de Familia",
    icon: "familia",
    description: "Divorcios, alimentos, tenencia y régimen de visitas.",
  },
  {
    value: "sucesiones",
    label: "Sucesiones",
    icon: "documento",
    description: "Declaratorias de herederos, testamentos y partición de bienes.",
  },
  {
    value: "civil",
    label: "Derecho Civil",
    icon: "balanza",
    description: "Contratos, daños y perjuicios, responsabilidad civil.",
  },
  {
    value: "laboral",
    label: "Derecho Laboral",
    icon: "maletin",
    description: "Despidos, liquidaciones y accidentes de trabajo.",
  },
  {
    value: "penal",
    label: "Derecho Penal",
    icon: "escudo",
    description: "Defensa penal, excarcelaciones y exenciones.",
  },
  {
    value: "societario",
    label: "Derecho Societario",
    icon: "edificio",
    description: "Constitución de sociedades y contratos comerciales.",
  },
] as const;

export function serviceLabels(values: string[]): string[] {
  const byValue = new Map<string, string>(
    ABOGADO_SERVICES.map((s) => [s.value, s.label])
  );
  return values.map((v) => byValue.get(v) ?? v);
}

export interface AbogadoServiceEntry {
  value: string;
  label: string;
  icon: string;
  description: string;
}

// Full catalog entries for the selected service values, in catalog order --
// used by the Moderno template's services grid, which shows however many
// áreas de práctica a lawyer picked rather than a fixed count.
export function serviceEntries(values: string[]): AbogadoServiceEntry[] {
  const selected = new Set(values);
  return ABOGADO_SERVICES.filter((s) => selected.has(s.value));
}

export interface AbogadoTextTemplateData {
  nombre: string;
  matricula: string;
  colegio: string;
  servicios: string[];
}

// Single suggested-text option, same rationale as contadores.ts: keep the
// "Sobre mí" step to one decision (sugerido vs. propio), not two.
export function getSuggestedAbogadoText({
  nombre,
  matricula,
  colegio,
  servicios,
}: AbogadoTextTemplateData): string {
  return `Soy ${nombre}, abogado/a matriculado/a (matrícula ${matricula}, ${colegio}). Me especializo en ${formatListWithAnd(
    serviceLabels(servicios)
  )}. Te acompaño con un asesoramiento claro y cercano en cada etapa de tu caso.`;
}
