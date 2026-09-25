// Onboarding never enforces input casing on the "name" field (a professional
// can type "juan perez" or "JUAN PEREZ"), so every public template applies
// this at render time instead of trusting the raw stored value.
export function capitalizeName(name: string): string {
  return name
    .split(" ")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}
