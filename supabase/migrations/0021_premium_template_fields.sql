-- Premium redesign of every existing profession's landing: adds the fields
-- needed for a real "servicios" grid (icon+title+description per item,
-- editable instead of a fixed checkbox catalog), a "por qué elegirnos"
-- points list, and testimonios.
--
-- NOTE: this migration was written assuming the local migrations directory
-- reflected production, but production already has a
-- "contadores_extra_fields_and_auditoria_service" migration (applied
-- 2026-09-22, no matching file in this repo) that added titulo_profesional,
-- anos_experiencia, cantidad_clientes, linkedin_url, instagram_url,
-- horario_atencion, slogan, and an "auditoria" servicios option to
-- contadores. This migration only adds what's genuinely still missing per
-- profession as of that state, to avoid duplicate keys in form_schema.
--
-- `servicios` (checkbox-group) is intentionally left in place for both
-- professions rather than removed: the onboarding wizards
-- (AbogadoWizard.tsx/ContadorWizard.tsx) still write it and use it to build
-- the suggested "sobre mí" text, and existing landings' form_data already
-- has it. The new `servicios_detallados` repeater is additive; templates
-- fall back to deriving entries from `servicios` + the profession's service
-- catalog when a landing has no `servicios_detallados` yet, so nothing goes
-- blank for existing customers and nothing breaks for new signups going
-- through the (unchanged) wizards.
--
-- testimonios has no backfill and no generic-copy fallback -- fabricating
-- customer quotes would be dishonest (same rule already applied when
-- Moderno templates were first built). Templates hide that section
-- entirely until a professional adds their own.

-- Abogados: still missing all of these.
update public.professions
set form_schema = jsonb_set(
  form_schema,
  '{fields}',
  (form_schema->'fields') || '[
    { "key": "slogan", "label": "Frase / slogan", "type": "text", "required": false, "max_length": 150 },
    { "key": "cta_text", "label": "Texto del botón principal", "type": "text", "required": false, "max_length": 40 },
    { "key": "horario_atencion", "label": "Horario de atención", "type": "text", "required": false, "max_length": 150 },
    { "key": "instagram_url", "label": "Instagram (opcional)", "type": "text", "required": false, "max_length": 200 },
    { "key": "anos_experiencia", "label": "Años de experiencia", "type": "text", "required": false, "max_length": 10 },
    { "key": "servicios_detallados", "label": "Servicios / especialidades", "type": "repeater", "required": false, "min_items": 6, "item_fields": [
      { "key": "icono", "label": "Ícono (un emoji)", "type": "icon", "required": false },
      { "key": "titulo", "label": "Título", "type": "text", "max_length": 60 },
      { "key": "descripcion", "label": "Descripción", "type": "textarea", "max_length": 150 }
    ] },
    { "key": "por_que_elegirnos", "label": "Por qué elegirnos", "type": "repeater", "required": false, "min_items": 3, "max_items": 4, "item_fields": [
      { "key": "icono", "label": "Ícono (un emoji)", "type": "icon", "required": false },
      { "key": "titulo", "label": "Punto destacado", "type": "text", "max_length": 80 }
    ] },
    { "key": "testimonios", "label": "Testimonios de clientes", "type": "repeater", "required": false, "min_items": 3, "item_fields": [
      { "key": "nombre", "label": "Nombre del cliente", "type": "text", "max_length": 60 },
      { "key": "cargo", "label": "Cargo / detalle (opcional)", "type": "text", "max_length": 60, "required": false },
      { "key": "texto", "label": "Testimonio", "type": "textarea", "max_length": 300 }
    ] }
  ]'::jsonb
)
where slug = 'abogados';

-- Contadores: titulo_profesional/anos_experiencia/cantidad_clientes/
-- linkedin_url/instagram_url/horario_atencion/slogan already exist in
-- production (see note above) -- only add what's genuinely new.
update public.professions
set form_schema = jsonb_set(
  form_schema,
  '{fields}',
  (form_schema->'fields') || '[
    { "key": "direccion", "label": "Dirección (opcional)", "type": "text", "required": false, "max_length": 150 },
    { "key": "cta_text", "label": "Texto del botón principal", "type": "text", "required": false, "max_length": 40 },
    { "key": "servicios_detallados", "label": "Servicios / especialidades", "type": "repeater", "required": false, "min_items": 6, "item_fields": [
      { "key": "icono", "label": "Ícono (un emoji)", "type": "icon", "required": false },
      { "key": "titulo", "label": "Título", "type": "text", "max_length": 60 },
      { "key": "descripcion", "label": "Descripción", "type": "textarea", "max_length": 150 }
    ] },
    { "key": "por_que_elegirnos", "label": "Por qué elegirnos", "type": "repeater", "required": false, "min_items": 3, "max_items": 4, "item_fields": [
      { "key": "icono", "label": "Ícono (un emoji)", "type": "icon", "required": false },
      { "key": "titulo", "label": "Punto destacado", "type": "text", "max_length": 80 }
    ] },
    { "key": "testimonios", "label": "Testimonios de clientes", "type": "repeater", "required": false, "min_items": 3, "item_fields": [
      { "key": "nombre", "label": "Nombre del cliente", "type": "text", "max_length": 60 },
      { "key": "cargo", "label": "Cargo / detalle (opcional)", "type": "text", "max_length": 60, "required": false },
      { "key": "texto", "label": "Testimonio", "type": "textarea", "max_length": 300 }
    ] }
  ]'::jsonb
)
where slug = 'contadores';
