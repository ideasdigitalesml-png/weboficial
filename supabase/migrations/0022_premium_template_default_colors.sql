-- The per-template `config.primaryColor`/`secondaryColor` stored on the
-- `templates` rows override each template component's own DEFAULT_PRIMARY/
-- DEFAULT_ACCENT constants (see PublicLandingView.tsx, which always passes
-- templateConfig.primaryColor/secondaryColor explicitly). The premium
-- redesign (migration 0021 + template component changes) updated the
-- component-level defaults but that has no effect on any already-existing
-- template row, which is what every real published/draft landing and the
-- onboarding wizard's "elegí tu diseño" preview actually render with.
-- Fixing the rows here is what makes the new palette actually show up
-- anywhere.
update public.templates t
set config = jsonb_set(
  jsonb_set(t.config, '{primaryColor}', '"#1a2744"'),
  '{secondaryColor}', '"#c9a84c"'
)
from public.professions p
where t.profession_id = p.id and p.slug = 'abogados';

update public.templates t
set config = jsonb_set(
  jsonb_set(t.config, '{primaryColor}', '"#1b4f72"'),
  '{secondaryColor}', '"#1b4f72"'
)
from public.professions p
where t.profession_id = p.id and p.slug = 'contadores';
