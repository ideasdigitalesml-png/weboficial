export type FormFieldType = "text" | "textarea" | "email" | "phone" | "image";

export interface FormFieldSchema {
  key: string;
  label: string;
  type: FormFieldType;
  required: boolean;
  min_length?: number;
  max_length?: number;
}

export interface FormSchema {
  fields: FormFieldSchema[];
}

export type FormValidationResult =
  | { valid: true; data: Record<string, string> }
  | { valid: false; errors: Record<string, string> };

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_RE = /^\+?[0-9 ()-]{6,20}$/;
const URL_RE = /^https?:\/\/.+/i;

// Server-side is the only source of truth for form_data. The client may use
// this same schema to render inputs and give live feedback, but that is UX
// only -- every write is re-validated here regardless of what the client sent.
export function validateFormData(
  schema: FormSchema,
  input: unknown
): FormValidationResult {
  const errors: Record<string, string> = {};
  const data: Record<string, string> = {};

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

    if (value === undefined || value === null || value === "") {
      if (field.required) {
        errors[field.key] = `${field.label} es obligatorio`;
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
    if (field.type === "image" && !URL_RE.test(trimmed)) {
      errors[field.key] = `${field.label} debe ser una URL http(s) válida`;
      continue;
    }

    data[field.key] = trimmed;
  }

  if (Object.keys(errors).length > 0) {
    return { valid: false, errors };
  }
  return { valid: true, data };
}
