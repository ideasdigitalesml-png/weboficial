import { formatListWithAnd } from "@/lib/format-list";
import { abogadoTitle, type Genero } from "@/lib/gendered-title";

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
  genero?: Genero;
}

// Single suggested-text option, same rationale as contadores.ts: keep the
// "Sobre mí" step to one decision (sugerido vs. propio), not two.
interface RepeaterItem {
  [key: string]: string;
}

// Emoji stand-ins for the SVG icon keys above -- used only as a fallback
// when a landing has no servicios_detallados yet (created before migration
// 0018 added that field). The premium templates render icono as a literal
// emoji/short string for every repeater field, so this keeps existing
// landings' services grid populated without the professional having to
// redo anything.
const SERVICE_EMOJI: Record<string, string> = {
  familia: "👪",
  sucesiones: "📜",
  civil: "⚖️",
  laboral: "💼",
  penal: "🛡️",
  societario: "🏢",
};

// Prefer formData.servicios_detallados (fully professional-editable) when
// present; otherwise derive equivalent cards from the older
// servicios checkbox-group + the fixed catalog above, so a landing that
// pre-dates migration 0018 still shows a real services grid instead of an
// empty one.
export function deriveAbogadoServiceEntries(formData: {
  servicios_detallados?: RepeaterItem[];
  servicios?: string[];
}): RepeaterItem[] {
  if (formData.servicios_detallados && formData.servicios_detallados.length > 0) {
    return formData.servicios_detallados;
  }
  return serviceEntries(formData.servicios ?? []).map((s) => ({
    icono: SERVICE_EMOJI[s.icon] ?? "⚖️",
    titulo: s.label,
    descripcion: s.description,
  }));
}

// Generic value-props, not data about a specific professional -- same
// rationale as PROCESO/FAQ in AbogadoModernoTemplate: fixed informational
// copy is fine, fabricated specific facts (client counts, made-up years)
// are not. Used only when a landing has no por_que_elegirnos of its own.
export const DEFAULT_ABOGADO_WHY_US: RepeaterItem[] = [
  { icono: "🤝", titulo: "Atención personalizada en cada caso" },
  { icono: "⚡", titulo: "Respuesta rápida por WhatsApp" },
  { icono: "📄", titulo: "Primera consulta sin costo" },
  { icono: "⚖️", titulo: "Seguimiento claro en cada etapa del proceso" },
];

export function getSuggestedAbogadoText({
  nombre,
  matricula,
  colegio,
  servicios,
  genero,
}: AbogadoTextTemplateData): string {
  return `Soy ${nombre}, ${abogadoTitle(genero)} (matrícula ${matricula}, ${colegio}). Me especializo en ${formatListWithAnd(
    serviceLabels(servicios)
  )}. Te acompaño con un asesoramiento claro y cercano en cada etapa de tu caso.`;
}
