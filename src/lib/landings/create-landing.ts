import type { SupabaseClient } from "@supabase/supabase-js";
import { validateFormData, type FormSchema } from "../forms/validate-form-data";
import { slugify, isValidSlugFormat, generateSlugCandidates } from "./slug";

export const DEFAULT_SECTIONS_CONFIG = [
  { id: "hero", visible: true, order: 1 },
  { id: "about", visible: true, order: 2 },
  { id: "services", visible: true, order: 3 },
  { id: "contact", visible: true, order: 4 },
];

export interface CreateLandingInput {
  professionId: string;
  templateId: string;
  formData: Record<string, unknown>;
  desiredSlug: string;
}

export type CreateLandingResult =
  | { ok: true; landing: { id: string; slug: string } }
  | { ok: false; reason: "not_authenticated" }
  | { ok: false; reason: "already_has_landing" }
  | { ok: false; reason: "invalid_profession_or_template" }
  | { ok: false; reason: "invalid_form_data"; errors: Record<string, string> }
  | { ok: false; reason: "invalid_slug"; message: string }
  | { ok: false; reason: "slug_taken"; suggestions: string[] }
  | { ok: false; reason: "no_active_plan" };

const INVALID_SLUG_MESSAGE =
  "El slug debe tener entre 3 y 63 caracteres, solo minúsculas, números y guiones, y no puede ser una palabra reservada.";

// This is the single place that is allowed to insert a row into `landings`.
// It always runs against a caller-supplied, RLS-scoped Supabase client (the
// user's own session) -- never the service role key -- so ownership and the
// draft-only insert policy are enforced by Postgres regardless of what this
// function does.
export async function createLandingForUser(
  supabase: SupabaseClient,
  userId: string,
  input: CreateLandingInput
): Promise<CreateLandingResult> {
  const { data: existing } = await supabase
    .from("landings")
    .select("id")
    .eq("user_id", userId)
    .maybeSingle();

  if (existing) {
    return { ok: false, reason: "already_has_landing" };
  }

  const { data: profession } = await supabase
    .from("professions")
    .select("id, form_schema")
    .eq("id", input.professionId)
    .maybeSingle();

  const { data: template } = await supabase
    .from("templates")
    .select("id, profession_id")
    .eq("id", input.templateId)
    .maybeSingle();

  if (!profession || !template || template.profession_id !== profession.id) {
    return { ok: false, reason: "invalid_profession_or_template" };
  }

  const validation = validateFormData(
    profession.form_schema as FormSchema,
    input.formData
  );
  if (!validation.valid) {
    return { ok: false, reason: "invalid_form_data", errors: validation.errors };
  }

  const slug = slugify(input.desiredSlug);
  if (!isValidSlugFormat(slug)) {
    return { ok: false, reason: "invalid_slug", message: INVALID_SLUG_MESSAGE };
  }

  const { data: plan } = await supabase
    .from("plans")
    .select("id")
    .eq("active", true)
    .limit(1)
    .maybeSingle();

  if (!plan) {
    return { ok: false, reason: "no_active_plan" };
  }

  const { data: inserted, error: insertError } = await supabase
    .from("landings")
    .insert({
      user_id: userId,
      profession_id: profession.id,
      template_id: template.id,
      plan_id: plan.id,
      slug,
      internal_subdomain: slug,
      domain_type: "subdomain",
      form_data: validation.data,
      sections_config: DEFAULT_SECTIONS_CONFIG,
    })
    .select("id, slug")
    .single();

  if (insertError) {
    if (insertError.code === "23505") {
      if (insertError.message.includes("landings_user_id_key")) {
        return { ok: false, reason: "already_has_landing" };
      }
      const suggestions = await findAvailableSlugSuggestions(supabase, slug);
      return { ok: false, reason: "slug_taken", suggestions };
    }
    throw insertError;
  }

  return { ok: true, landing: inserted };
}

export type SlugCheckResult =
  | { valid: true; available: true; slug: string }
  | { valid: true; available: false; slug: string; suggestions: string[] }
  | { valid: false; message: string };

export async function checkSlugAvailability(
  supabase: SupabaseClient,
  rawSlug: string
): Promise<SlugCheckResult> {
  const slug = slugify(rawSlug);
  if (!isValidSlugFormat(slug)) {
    return { valid: false, message: INVALID_SLUG_MESSAGE };
  }

  const { data: taken } = await supabase.rpc("is_slug_taken", {
    candidate: slug,
  });

  if (!taken) {
    return { valid: true, available: true, slug };
  }

  const suggestions = await findAvailableSlugSuggestions(supabase, slug);
  return { valid: true, available: false, slug, suggestions };
}

export async function findAvailableSlugSuggestions(
  supabase: SupabaseClient,
  base: string,
  count = 3
): Promise<string[]> {
  const candidates = generateSlugCandidates(base);
  const { data: taken } = await supabase.rpc("filter_taken_slugs", {
    candidates,
  });

  const takenSet = new Set<string>(taken ?? []);
  const available = candidates.filter((c) => !takenSet.has(c));

  while (available.length < count) {
    const fallback = slugify(`${base}-${Math.floor(1000 + Math.random() * 9000)}`);
    if (!takenSet.has(fallback) && !available.includes(fallback)) {
      available.push(fallback);
    }
  }

  return available.slice(0, count);
}
