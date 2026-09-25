// The Supabase client used across this codebase has no generated Database
// types, so its inference for an embedded to-one relation (e.g.
// landings.profession_id -> professions, landings.template_id -> templates)
// is unreliable about whether it comes back as a single object or a
// single-element array. Shared by every fetch that embeds a to-one join, so
// this normalization lives in exactly one place.
export function oneRelation<T>(rel: T | T[] | null): T | null {
  return Array.isArray(rel) ? (rel[0] ?? null) : rel;
}
