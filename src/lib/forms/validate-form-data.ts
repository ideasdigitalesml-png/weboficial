export type FormFieldType =
  | "text"
  | "textarea"
  | "email"
  | "phone"
  | "whatsapp"
  | "image"
  | "select"
  | "checkbox-group"
  | "repeater";

export interface FormFieldOption {
  value: string;
  label: string;
}

// Describes one column of a "repeater" field's items (e.g. a service card's
// icono/titulo/descripcion) -- not a top-level FormFieldSchema itself, since
// items never need image/whatsapp/select/nested-repeater columns.
export interface RepeaterItemFieldSchema {
  key: string;
  label: string;
  type: "text" | "textarea" | "icon";
  max_length?: number;
  // Defaults to true. Set false for columns like "cargo" on a testimonio
  // that are fine left blank.
  required?: boolean;
}

export interface FormFieldSchema {
  key: string;
  label: string;
  type: FormFieldType;
  required: boolean;
  // UI hint only (shown via FieldInput's `placeholder` attribute), never
  // validated server-side -- e.g. "Ej: 12.847" on a matricula field so a
  // professional sees a real-looking example instead of a blank box.
  placeholder?: string;
  // UI hint only (shown via FieldInput as a fixed adornment to the left of
  // a "text" input, e.g. "$" on precio_consulta) -- never stored. The typed
  // value stays a plain number/string; the symbol is purely visual here and
  // re-added at render time by the templates.
  prefix?: string;
  min_length?: number;
  max_length?: number;
  options?: FormFieldOption[];
  min_selected?: number;
  // "repeater" only. min_items/max_items are UI hints for FieldInput (show a
  // "recomendamos al menos N" message, disable "add" past max) -- not
  // enforced server-side, so a professional can always save partial
  // progress while still building out their services/testimonios list.
  item_fields?: RepeaterItemFieldSchema[];
  min_items?: number;
  max_items?: number;
}

export interface FormSchema {
  fields: FormFieldSchema[];
}

export type RepeaterItem = Record<string, string>;

export type FormFieldValue = string | string[] | RepeaterItem[];

export type FormValidationResult =
  | { valid: true; data: Record<string, FormFieldValue> }
  | { valid: false; errors: Record<string, string> };

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_RE = /^\+?[0-9 ()-]{6,20}$/;
const WHATSAPP_RE = /^\+[1-9]\d{7,14}$/;
const URL_RE = /^https?:\/\/.+/i;

const MULTI_VALUE_TYPES = new Set<FormFieldType>(["checkbox-group"]);

// Server-side is the only source of truth for form_data. The client may use
// this same schema to render inputs and give live feedback, but that is UX
// only -- every write is re-validated here regardless of what the client sent.
export function validateFormData(
  schema: FormSchema,
  input: unknown
): FormValidationResult {
  const errors: Record<string, string> = {};
  const data: Record<string, FormFieldValue> = {};

  if (typeof input !== "object" || input === null || Array.isArray(input)) {
    return { valid: false, errors: { _form: "form_data debe ser un objeto" } };
  }

  const raw = input as Record<string, unknown>;
  const allowedKeys = new Set(schema.fields.map((f) => f.key));

  for (const key of Object.keys(raw)) {
    if (!allowedKeys.has(key)) {
      errors[key] = "Campo no reconocido para esta profesión";
    }
  }

  for (const field of schema.fields) {
    const value = raw[field.key];
    const isEmpty =
      value === undefined ||
      value === null ||
      value === "" ||
      (Array.isArray(value) && value.length === 0);

    if (isEmpty) {
      if (field.required) {
        errors[field.key] = `${field.label} es obligatorio`;
      }
      continue;
    }

    if (MULTI_VALUE_TYPES.has(field.type)) {
      const result = validateMultiValueField(field, value);
      if (typeof result === "string") {
        errors[field.key] = result;
      } else {
        data[field.key] = result;
      }
      continue;
    }

    if (field.type === "repeater") {
      const result = validateRepeaterField(field, value);
      if (typeof result === "string") {
        errors[field.key] = result;
      } else {
        data[field.key] = result as unknown as FormFieldValue;
      }
      continue;
    }

    if (typeof value !== "string") {
      errors[field.key] = `${field.label} debe ser texto`;
      continue;
    }

    const trimmed = value.trim();

    if (field.min_length && trimmed.length < field.min_length) {
      errors[field.key] =
        `${field.label} debe tener al menos ${field.min_length} caracteres`;
      continue;
    }
    if (field.max_length && trimmed.length > field.max_length) {
      errors[field.key] =
        `${field.label} debe tener como máximo ${field.max_length} caracteres`;
      continue;
    }

    if (field.type === "email" && !EMAIL_RE.test(trimmed)) {
      errors[field.key] = `${field.label} no es un email válido`;
      continue;
    }
    if (field.type === "phone" && !PHONE_RE.test(trimmed)) {
      errors[field.key] = `${field.label} no es un teléfono válido`;
      continue;
    }
    if (field.type === "whatsapp" && !WHATSAPP_RE.test(trimmed)) {
      errors[field.key] = `${field.label} no es un número válido`;
      continue;
    }
    if (field.type === "image" && !URL_RE.test(trimmed)) {
      errors[field.key] = `${field.label} debe ser una URL http(s) válida`;
      continue;
    }
    if (field.type === "select" && field.options) {
      const allowed = new Set(field.options.map((o) => o.value));
      if (!allowed.has(trimmed)) {
        errors[field.key] = `${field.label} no es una opción válida`;
        continue;
      }
    }

    data[field.key] = trimmed;
  }

  if (Object.keys(errors).length > 0) {
    return { valid: false, errors };
  }
  return { valid: true, data };
}

function validateRepeaterField(
  field: FormFieldSchema,
  value: unknown
): RepeaterItem[] | string {
  if (!Array.isArray(value)) {
    return `${field.label} debe ser una lista`;
  }

  const itemFields = field.item_fields ?? [];
  const allowedKeys = new Set(itemFields.map((f) => f.key));
  const cleaned: RepeaterItem[] = [];

  for (const rawItem of value) {
    if (typeof rawItem !== "object" || rawItem === null || Array.isArray(rawItem)) {
      return `${field.label} tiene un elemento inválido`;
    }
    const item = rawItem as Record<string, unknown>;
    for (const key of Object.keys(item)) {
      if (!allowedKeys.has(key)) {
        return `${field.label} tiene un campo no reconocido`;
      }
    }

    const cleanedItem: RepeaterItem = {};
    for (const itemField of itemFields) {
      const raw = item[itemField.key];
      const isBlank = raw === undefined || raw === null || raw === "";
      const itemRequired = itemField.required ?? true;

      if (isBlank) {
        if (itemRequired) {
          return `${field.label}: "${itemField.label}" es obligatorio en cada elemento`;
        }
        cleanedItem[itemField.key] = "";
        continue;
      }

      if (typeof raw !== "string") {
        return `${field.label}: "${itemField.label}" debe ser texto`;
      }
      const trimmed = raw.trim();
      if (itemField.max_length && trimmed.length > itemField.max_length) {
        return `${field.label}: "${itemField.label}" debe tener como máximo ${itemField.max_length} caracteres`;
      }
      cleanedItem[itemField.key] = trimmed;
    }
    cleaned.push(cleanedItem);
  }

  return cleaned;
}

function validateMultiValueField(
  field: FormFieldSchema,
  value: unknown
): string[] | string {
  if (!Array.isArray(value) || !value.every((v) => typeof v === "string")) {
    return `${field.label} debe ser una lista`;
  }

  const allowed = new Set((field.options ?? []).map((o) => o.value));
  const deduped = Array.from(new Set(value as string[]));

  for (const v of deduped) {
    if (!allowed.has(v)) {
      return `${field.label} tiene una opción no reconocida`;
    }
  }

  if (field.min_selected && deduped.length < field.min_selected) {
    return `${field.label} requiere al menos ${field.min_selected} opción(es)`;
  }

  return deduped;
}
