// Top-level route segments that already exist as real internal
// pages/APIs in this app (see src/app/*). A landing's slug can never equal
// one of these -- both slug.ts (blocking it at creation time) and the
// path-based landing route (src/app/[slug]/page.tsx, a temporary
// alternative to subdomain routing) check against this same set, so a
// landing can never become unreachable by colliding with an internal route.
export const RESERVED_TOP_LEVEL_ROUTES = new Set([
  "dashboard",
  "login",
  "onboarding",
  "auth",
  "api",
  "site",
  "admin",
]);
