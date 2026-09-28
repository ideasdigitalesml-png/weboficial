-- Tracks the first time a customer shared their published page (dashboard
-- "Pasos para dejar lista tu página" checklist, step 4). Marked once via
-- markLandingSharedAction -- either the persistent "Copiar link" button or
-- the "Compartir por WhatsApp" button, whichever the customer taps first --
-- and never cleared afterwards, so this is a one-way "did they ever share
-- it" flag, not a share counter.
alter table public.landings
  add column if not exists shared_at timestamptz;
