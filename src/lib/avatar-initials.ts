// Shared by every profession's "Moderno"-style server-rendered template
// (contador, abogado, ...) for the photo-fallback avatar: first letter of
// the first two words of the professional's name, uppercased.
export function getInitials(name: string): string {
  const trimmed = name.trim();
  if (!trimmed) return "?";
  return trimmed
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w.charAt(0).toUpperCase())
    .join("");
}
