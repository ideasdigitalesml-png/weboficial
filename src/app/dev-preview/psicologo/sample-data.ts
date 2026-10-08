export { PSICOLOGO_DEMO_PROFILE as PSICOLOGO_PREVIEW_DATA } from "@/lib/demo-profiles";

// Matches each layout's DEFAULT_PRIMARY/DEFAULT_ACCENT in its own template
// file, which in turn matches the `templates.config` row seeded for
// psicologos (migration 0023) -- keeps the thumbnail's colors identical to
// what a real landing on that template actually looks like.
export const PSICOLOGO_PREVIEW_COLORS: Record<string, { primary: string; accent: string }> = {
  moderno: { primary: "#6b7f6b", accent: "#6b7f6b" },
  clasico: { primary: "#5b6b8c", accent: "#5b6b8c" },
  minimal: { primary: "#8b7d9e", accent: "#8b7d9e" },
};
