import type { SupabaseClient } from "@supabase/supabase-js";
import {
  validateFormData,
  type FormSchema,
  type FormFieldValue,
} from "../forms/validate-form-data";
import { CONTADOR_PALETAS } from "../templates/contador-paletas";
import { ABOGADO_PALETAS } from "../templates/abogado-paletas";

export interface SectionConfigItem {
  id: string;
  visible: boolean;
  order: number;
}

export type UpdateFormDataResult =
  | { ok: true; formData: Record<string, FormFieldValue> }
  | { ok: false; reason: "not_found" }
  | { ok: false; reason: "invalid_form_data"; errors: Record<string, string> };

// The only place allowed to write to `landings.form_data` after creation.
// Always runs against the caller's own RLS-scoped client, and re-validates
// against the profession's form_schema server-side regardless of what the
// client already validated -- the client's copy of the schema is UX only.
// Only ever writes the `form_data` column: there is no code path here that
// can touch `status` or `template_id`, and Postgres additionally rejects any
// attempt to change `status` outside the Mercado Pago webhook (service_role).
export async function updateLandingFormData(
  supabase: SupabaseClient,
  userId: string,
  landingId: string,
  formData: unknown
): Promise<UpdateFormDataResult> {
  const { data: landing } = await supabase
    .from("landings")
    .select("id, profession_id")
    .eq("id", landingId)
    .eq("user_id", userId)
    .maybeSingle();

  if (!landing) {
    return { ok: false, reason: "not_found" };
  }

  const { data: profession } = await supabase
    .from("professions")
    .select("form_schema")
    .eq("id", landing.profession_id)
    .maybeSingle();

  if (!profession) {
    return { ok: false, reason: "not_found" };
  }

  const validation = validateFormData(
    profession.form_schema as FormSchema,
    formData
  );
  if (!validation.valid) {
    return { ok: false, reason: "invalid_form_data", errors: validation.errors };
  }

  const { data: updated } = await supabase
    .from("landings")
    .update({ form_data: validation.data })
    .eq("id", landingId)
    .eq("user_id", userId)
    .select("id")
    .maybeSingle();

  if (!updated) {
    return { ok: false, reason: "not_found" };
  }

  return { ok: true, formData: validation.data };
}

export type UpdateSectionsConfigResult =
  | { ok: true; sectionsConfig: SectionConfigItem[] }
  | { ok: false; reason: "not_found" }
  | { ok: false; reason: "invalid_sections_config"; message: string };

const INVALID_SECTIONS_MESSAGE =
  "sections_config solo puede reordenar y mostrar/ocultar las secciones existentes, no agregar ni quitar ninguna.";

// The template (and therefore its set of section ids) is fixed forever once
// a landing is created, so the only legal edits to sections_config are
// reordering and toggling `visible` on the exact same set of ids the landing
// already has -- never adding, removing, or renaming a section.
function isValidSectionsConfig(
  current: unknown,
  input: unknown
): input is SectionConfigItem[] {
  if (!Array.isArray(current) || !Array.isArray(input)) return false;
  if (input.length !== current.length) return false;

  const currentIds = new Set(
    current.map((s) => (s as { id?: unknown }).id)
  );
  const seenIds = new Set<string>();

  for (const item of input) {
    if (typeof item !== "object" || item === null) return false;
    const { id, visible, order } = item as Record<string, unknown>;
    if (typeof id !== "string" || !currentIds.has(id) || seenIds.has(id)) {
      return false;
    }
    if (typeof visible !== "boolean") return false;
    if (typeof order !== "number" || !Number.isFinite(order)) return false;
    seenIds.add(id);
  }

  return true;
}

// Same shape of guarantee as updateLandingFormData: RLS-scoped client, only
// ever writes `sections_config`, never `status` or `template_id`.
export async function updateLandingSectionsConfig(
  supabase: SupabaseClient,
  userId: string,
  landingId: string,
  sectionsConfig: unknown
): Promise<UpdateSectionsConfigResult> {
  const { data: landing } = await supabase
    .from("landings")
    .select("id, sections_config")
    .eq("id", landingId)
    .eq("user_id", userId)
    .maybeSingle();

  if (!landing) {
    return { ok: false, reason: "not_found" };
  }

  if (!isValidSectionsConfig(landing.sections_config, sectionsConfig)) {
    return {
      ok: false,
      reason: "invalid_sections_config",
      message: INVALID_SECTIONS_MESSAGE,
    };
  }

  const { data: updated } = await supabase
    .from("landings")
    .update({ sections_config: sectionsConfig })
    .eq("id", landingId)
    .eq("user_id", userId)
    .select("id")
    .maybeSingle();

  if (!updated) {
    return { ok: false, reason: "not_found" };
  }

  return { ok: true, sectionsConfig };
}

export type UpdateLandingPaletaResult =
  | { ok: true; paletaId: string }
  | { ok: false; reason: "not_found" }
  | { ok: false; reason: "invalid_paleta" };

const PALETAS_BY_PROFESSION: Record<string, ReadonlySet<string>> = {
  contadores: new Set(CONTADOR_PALETAS.map((p) => p.id)),
  abogados: new Set(ABOGADO_PALETAS.map((p) => p.id)),
};

// Same shape of guarantee as the two functions above: RLS-scoped client,
// only ever writes `paleta_id`. paletaId is validated against the fixed
// set for the landing's profession rather than trusted as free text --
// the column itself is just `text`, so this is the only thing stopping an
// arbitrary string from ending up there and silently falling back to the
// default paleta at render time.
export async function updateLandingPaleta(
  supabase: SupabaseClient,
  userId: string,
  landingId: string,
  paletaId: string
): Promise<UpdateLandingPaletaResult> {
  const { data: landing } = await supabase
    .from("landings")
    .select("id, professions(slug)")
    .eq("id", landingId)
    .eq("user_id", userId)
    .maybeSingle();

  if (!landing) {
    return { ok: false, reason: "not_found" };
  }

  const professionRel = landing.professions as
    | { slug: string }
    | { slug: string }[]
    | null;
  const professionSlug = Array.isArray(professionRel)
    ? professionRel[0]?.slug
    : professionRel?.slug;

  const allowed = professionSlug ? PALETAS_BY_PROFESSION[professionSlug] : undefined;
  if (!allowed || !allowed.has(paletaId)) {
    return { ok: false, reason: "invalid_paleta" };
  }

  const { data: updated } = await supabase
    .from("landings")
    .update({ paleta_id: paletaId })
    .eq("id", landingId)
    .eq("user_id", userId)
    .select("id")
    .maybeSingle();

  if (!updated) {
    return { ok: false, reason: "not_found" };
  }

  return { ok: true, paletaId };
}
