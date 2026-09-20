-- Per-landing color palette selection (Feature 3: paleta de colores).
-- Independent from templates.config's primaryColor/secondaryColor, which
-- stay as the *default* palette for a template family -- paleta_id lets an
-- individual landing override those with one of a fixed set of curated
-- palettes (see src/lib/templates/*-paletas.ts), never a free color picker.
alter table public.landings
  add column if not exists paleta_id text not null default 'bosque';
