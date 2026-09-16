// Shared weboficial brand classes for both OnboardingWizard.tsx and
// ContadorWizard.tsx -- kept in one place so the two step flows (generic
// fallback vs. the dedicated contador wizard) never drift into two
// different button styles.
export const PRIMARY_BUTTON =
  "inline-flex min-h-12 items-center justify-center rounded-full bg-sky px-6 text-sm font-semibold text-white transition-colors hover:bg-sky-dark disabled:opacity-40";
export const SECONDARY_BUTTON =
  "inline-flex min-h-12 items-center justify-center rounded-full border border-border-subtle px-6 text-sm font-medium text-navy transition-colors hover:border-navy/40";
export const TOGGLE_ACTIVE =
  "font-semibold text-navy underline decoration-sky decoration-2 underline-offset-4";
export const TOGGLE_INACTIVE = "text-text-body";
