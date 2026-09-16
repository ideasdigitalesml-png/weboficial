-- The 0003 seed's "Clásico" primaryColor (#0f172a) was a placeholder from
-- before any template had a reviewed palette. Swap in the approved neutral +
-- emerald accent from the contador template design review.
update public.templates
set config = jsonb_set(config, '{primaryColor}', '"#0F7A5C"')
where slug = 'clasico'
  and profession_id in (select id from public.professions where slug = 'contadores');
