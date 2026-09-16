import { formatListWithAnd } from "@/lib/format-list";

// Mirrors the "servicios" checkbox-group options in the 0008 migration's
// form_schema exactly (same value/label pairs) -- this copy is what the
// wizard UI renders, the DB copy is what the server validates against.
export const CONTADOR_SERVICES = [
  { value: "monotributo", label: "Monotributo" },
  { value: "iva", label: "IVA" },
  { value: "ganancias", label: "Impuesto a las Ganancias" },
  { value: "bienes_personales", label: "Bienes Personales" },
  { value: "liquidacion_sueldos", label: "Liquidación de sueldos" },
  { value: "constitucion_sociedades", label: "Constitución de sociedades" },
  { value: "balances", label: "Balances y estados contables" },
  { value: "asesoramiento_impositivo", label: "Asesoramiento impositivo general" },
] as const;

export function serviceLabels(values: string[]): string[] {
  const byValue = new Map<string, string>(
    CONTADOR_SERVICES.map((s) => [s.value, s.label])
  );
  return values.map((v) => byValue.get(v) ?? v);
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
