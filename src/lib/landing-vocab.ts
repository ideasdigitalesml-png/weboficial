// The only wording that changes between the home page and /psicologos for
// shared sections (turnos showcase, FAQ): "clientes" -> "pacientes" and
// "turno" -> "sesión". Contadores and abogados both use the default. Kept
// as one small vocab object (instead of separate profession-specific copy
// duplicated three times) so TurnosShowcase and FAQ stay in sync.
export interface LandingVocab {
  clientes: string;
  turno: string;
  // Indefinite article agreeing with `turno`'s gender -- "un turno" vs
  // "una sesión" -- so copy that precedes it with a hardcoded "un" doesn't
  // read as a grammar mistake on /psicologos.
  articuloTurno: string;
}

export const DEFAULT_LANDING_VOCAB: LandingVocab = {
  clientes: "clientes",
  turno: "turno",
  articuloTurno: "un",
};

export const PSICOLOGO_LANDING_VOCAB: LandingVocab = {
  clientes: "pacientes",
  turno: "sesión",
  articuloTurno: "una",
};
