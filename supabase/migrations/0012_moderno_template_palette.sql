-- The "Moderno" contador template now has its own design (Instrument
-- Serif + Inter, two-tone navy/verde), ported from templates/contador.html.
-- Swap its seed primaryColor placeholder (#2563eb) for the real navy, and
-- add secondaryColor for the green accent the new design needs alongside
-- it -- Clásico only ever needed a single accent color, Moderno needs two.
update public.templates
set config = jsonb_set(
  jsonb_set(config, '{primaryColor}', '"#0B2545"'),
  '{secondaryColor}',
  '"#1A6B4A"'
)
where slug = 'moderno'
  and profession_id in (select id from public.professions where slug = 'contadores');
