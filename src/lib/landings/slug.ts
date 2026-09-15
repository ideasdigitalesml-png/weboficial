import { RESERVED_TOP_LEVEL_ROUTES } from "../tenancy/reserved-routes";

// Real internal routes (RESERVED_TOP_LEVEL_ROUTES) plus infra-sounding,
// brand, and likely-future-route words, blocked defensively even though
// nothing serves them today.
const RESERVED_SLUGS = new Set([
  ...RESERVED_TOP_LEVEL_ROUTES,
  "www",
  "app",
  "admin",
  "mail",
  "ftp",
  "staging",
  "dev",
  "test",
  "assets",
  "static",
  "cdn",
  "blog",
  "help",
  "support",
  "status",
  "docs",
  "panel",
  "root",
  "mercadopago",
  "mp",
  "signup",
  "supabase",
  "plataforma",
]);

const SLUG_RE = /^[a-z0-9](?:[a-z0-9-]{1,61}[a-z0-9])?$/;
const COMBINING_MARKS_RE = /[\u0300-\u036f]/g;

export function slugify(input: string): string {
  return input
    .normalize("NFD")
    .replace(COMBINING_MARKS_RE, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 63)
    .replace(/-+$/g, "");
}

export function isValidSlugFormat(slug: string): boolean {
  return (
    slug.length >= 3 &&
    slug.length <= 63 &&
    SLUG_RE.test(slug) &&
    !RESERVED_SLUGS.has(slug)
  );
}

export function generateSlugCandidates(base: string): string[] {
  const trimmedBase = base.slice(0, 50);
  const suffixes = [
    "-contador",
    "-oficial",
    `-${Math.floor(100 + Math.random() * 900)}`,
  ];
  return suffixes.map((s) => slugify(`${trimmedBase}${s}`));
}
