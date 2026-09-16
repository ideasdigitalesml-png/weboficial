export type FormFieldType =
  | "text"
  | "textarea"
  | "email"
  | "phone"
  | "whatsapp"
  | "image"
  | "select"
  | "checkbox-group";

export interface FormFieldOption {
  value: string;
  label: string;
}

export interface FormFieldSchema {
  key: string;
  label: string;
  type: FormFieldType;
  required: boolean;
  min_length?: number;
  max_length?: number;
  options?: FormFieldOption[];
  min_selected?: number;
}

export interface FormSchema {
  fields: FormFieldSchema[];
}

export type FormFieldValue = string | string[];

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
