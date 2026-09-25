// Genero comes from the onboarding wizard's "Género" select field (added in
// migration 0026): masculino/femenino/no_indica, or undefined if the field
// was left blank (it's optional). Used by each profession's suggested-bio
// generator to say "contador"/"contadora" instead of a fixed masculine
// default or a slashed "contador/a" -- "no_indica" (or no answer) never
// falls back to guessing a gender, it drops the gendered word entirely.
export type Genero = "masculino" | "femenino" | "no_indica" | undefined;

export function contadorTitle(genero: Genero): string {
  if (genero === "femenino") return "Contadora Pública matriculada";
  if (genero === "masculino") return "Contador Público matriculado";
  return "profesional en Ciencias Económicas";
}

export function abogadoTitle(genero: Genero): string {
  if (genero === "femenino") return "abogada matriculada";
  if (genero === "masculino") return "abogado matriculado";
  return "profesional del derecho";
}

export function psicologoTitle(genero: Genero): string {
  if (genero === "femenino") return "Psicóloga";
  if (genero === "masculino") return "Psicólogo";
  return "Profesional de la salud mental";
}
