import { formatListWithAnd } from "@/lib/format-list";
import { contadorTitle, type Genero } from "@/lib/gendered-title";

// Mirrors the "servicios" checkbox-group options in the 0008 migration's
// form_schema exactly (same value/label pairs) -- this copy is what the
// wizard UI renders, the DB copy is what the server validates against.
// `icon` and `description` are presentational only (used by the Moderno
// template's services grid) and describe the SERVICE category generically
// -- never anything specific to an individual professional, so they carry
// no fabricated-data risk.
export const CONTADOR_SERVICES = [
  {
    value: "monotributo",
    label: "Monotributo",
    icon: "🧾",
    description: "Inscripción, recategorización y gestión de pagos mensuales.",
  },
  {
    value: "iva",
    label: "IVA",
    icon: "📊",
    description: "Liquidación y presentación de declaraciones juradas de IVA.",
  },
  {
    value: "ganancias",
    label: "Impuesto a las Ganancias",
    icon: "💰",
    description: "Cálculo y presentación anual, con seguimiento de anticipos.",
  },
  {
    value: "bienes_personales",
    label: "Bienes Personales",
    icon: "🏠",
    description: "Declaración jurada anual de bienes personales.",
  },
  {
    value: "liquidacion_sueldos",
    label: "Liquidación de sueldos",
    icon: "👥",
    description: "Liquidación mensual de haberes y cargas sociales.",
  },
  {
    value: "constitucion_sociedades",
    label: "Constitución de sociedades",
    icon: "🏢",
    description: "Alta, estatutos y trámites para empezar tu sociedad.",
  },
  {
    value: "balances",
    label: "Balances y estados contables",
    icon: "📈",
    description: "Confección y presentación de balances anuales.",
  },
  {
    value: "asesoramiento_impositivo",
    label: "Asesoramiento impositivo general",
    icon: "💬",
    description: "Consultas y planificación impositiva a medida.",
  },
  {
    value: "auditoria",
    label: "Auditoría",
    icon: "🔍",
    description: "Revisión y control de estados contables y procesos internos.",
  },
] as const;

export function serviceLabels(values: string[]): string[] {
  const byValue = new Map<string, string>(
    CONTADOR_SERVICES.map((s) => [s.value, s.label])
  );
  return values.map((v) => byValue.get(v) ?? v);
}

export interface ServiceEntry {
  value: string;
  label: string;
  icon: string;
  description: string;
}

// Full catalog entries (icon + description included) for the selected
// service values, in catalog order -- used by the Moderno template's
// services grid, which shows however many services a professional picked
// rather than a fixed count.
export function serviceEntries(values: string[]): ServiceEntry[] {
  const selected = new Set(values);
  return CONTADOR_SERVICES.filter((s) => selected.has(s.value));
}

interface RepeaterItem {
  [key: string]: string;
}

// Prefer formData.servicios_detallados (fully professional-editable) when
// present; otherwise derive equivalent cards from the older servicios
// checkbox-group + the fixed catalog above (CONTADOR_SERVICES icons are
// already emoji, so no separate mapping table is needed here unlike
// abogados.ts), so a landing that pre-dates migration 0018 still shows a
// real services grid instead of an empty one.
export function deriveContadorServiceEntries(formData: {
  servicios_detallados?: RepeaterItem[];
  servicios?: string[];
}): RepeaterItem[] {
  if (formData.servicios_detallados && formData.servicios_detallados.length > 0) {
    return formData.servicios_detallados;
  }
  return serviceEntries(formData.servicios ?? []).map((s) => ({
    icono: s.icon,
    titulo: s.label,
    descripcion: s.description,
  }));
}

// Generic value-props, not data about a specific professional -- fixed
// informational copy is fine (same rationale as any other static section),
// fabricated specific facts are not. Used only when a landing has no
// por_que_elegirnos of its own.
export const DEFAULT_CONTADOR_WHY_US: RepeaterItem[] = [
  { icono: "🤝", titulo: "Atención personalizada, sin letra chica" },
  { icono: "⚡", titulo: "Respuesta rápida por WhatsApp" },
  { icono: "📊", titulo: "Vencimientos y obligaciones siempre al día" },
  { icono: "💬", titulo: "Explicaciones claras, sin jerga contable" },
];

export interface TextTemplateData {
  nombre: string;
  matricula: string;
  jurisdiccion: string;
  servicios: string[];
  genero?: Genero;
}

export interface TextTemplate {
  professionId: string;
  options: {
    id: string;
    label: string;
    template: (data: TextTemplateData) => string;
  }[];
}

// Only one option ("cercano") on purpose -- the wizard offers a single
// suggested text with no style picker, to keep the "quiénes somos" step to
// one decision (sugerido vs. propio) instead of two. professionId is set at
// call time from the real profession row id (not known statically here).
export function buildContadorTextTemplate(professionId: string): TextTemplate {
  return {
    professionId,
    options: [
      {
        id: "cercano",
        label: "Cercano y directo",
        template: ({ nombre, matricula, jurisdiccion, servicios, genero }) =>
          `Soy ${nombre}, ${contadorTitle(genero)} (matrícula ${matricula}, ${jurisdiccion}). Me especializo en ${formatListWithAnd(
            serviceLabels(servicios)
          )}. Te ayudo a ordenar tus impuestos y tu contabilidad sin vueltas ni complicaciones, con respuestas claras y a tiempo.`,
      },
    ],
  };
}

export function getSuggestedContadorText(data: TextTemplateData): string {
  return buildContadorTextTemplate("contadores").options[0].template(data);
}
