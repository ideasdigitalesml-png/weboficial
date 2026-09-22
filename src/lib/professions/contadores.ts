import { formatListWithAnd } from "@/lib/format-list";

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

export interface TextTemplateData {
  nombre: string;
  matricula: string;
  jurisdiccion: string;
  servicios: string[];
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
        template: ({ nombre, matricula, jurisdiccion, servicios }) =>
          `Soy ${nombre}, Contador Público matriculado (matrícula ${matricula}, ${jurisdiccion}). Me especializo en ${formatListWithAnd(
            serviceLabels(servicios)
          )}. Te ayudo a ordenar tus impuestos y tu contabilidad sin vueltas ni complicaciones, con respuestas claras y a tiempo.`,
      },
    ],
  };
}

export function getSuggestedContadorText(data: TextTemplateData): string {
  return buildContadorTextTemplate("contadores").options[0].template(data);
}
