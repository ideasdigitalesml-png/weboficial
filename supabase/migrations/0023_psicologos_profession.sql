-- Third profession end to end: "Psicólogos". No dedicated onboarding
-- wizard (unlike contadores/abogados) -- it goes through the generic
-- OnboardingWizard/FieldInput schema-driven form, which already supports
-- every field type used here including "repeater" (built for the
-- abogado/contador premium redesign, migration 0021). No legacy
-- checkbox-group/derive-fallback needed either: this profession launches
-- straight with the premium field set, there's no pre-existing data shape
-- to stay backward compatible with.
--
-- Ethical/deontological note (per research: colegios de psicólogos'
-- códigos deontológicos): advertising must be sober, state título +
-- matrícula, and never promise guaranteed results -- none of these fields
-- ask for or encourage that, and testimonios (like every other profession)
-- has no fabricated fallback; the section is hidden until a professional
-- adds their own.
insert into public.professions (name, slug, form_schema)
values (
  'Psicólogos',
  'psicologos',
  '{
    "fields": [
      { "key": "name", "label": "Nombre y apellido", "type": "text", "required": true, "min_length": 2, "max_length": 100 },
      { "key": "titulo_profesional", "label": "Título profesional", "type": "text", "required": true, "min_length": 2, "max_length": 100 },
      { "key": "matricula_numero", "label": "Matrícula profesional", "type": "text", "required": true, "min_length": 1, "max_length": 50 },
      { "key": "profile_image", "label": "Foto de perfil", "type": "image", "required": false },
      { "key": "phone", "label": "WhatsApp", "type": "whatsapp", "required": true },
      { "key": "email", "label": "Email de contacto", "type": "email", "required": false },
      { "key": "direccion", "label": "Zona / consultorio (opcional)", "type": "text", "required": false, "max_length": 150 },
      { "key": "horario_atencion", "label": "Horario de atención", "type": "text", "required": false, "max_length": 150 },
      { "key": "modalidad", "label": "Modalidad de atención", "type": "select", "required": false, "options": [
        { "value": "presencial", "label": "Presencial" },
        { "value": "online", "label": "Online" },
        { "value": "ambas", "label": "Presencial y online" }
      ] },
      { "key": "enfoque_terapeutico", "label": "Enfoque terapéutico", "type": "text", "required": false, "max_length": 150 },
      { "key": "descripcion", "label": "Presentación personal", "type": "textarea", "required": false, "max_length": 800 },
      { "key": "precio_consulta", "label": "Precio de consulta (opcional)", "type": "text", "required": false, "max_length": 50 },
      { "key": "cta_text", "label": "Texto del botón principal", "type": "text", "required": false, "max_length": 40 },
      { "key": "linkedin_url", "label": "LinkedIn (opcional)", "type": "text", "required": false, "max_length": 200 },
      { "key": "instagram_url", "label": "Instagram (opcional)", "type": "text", "required": false, "max_length": 200 },
      { "key": "especialidades", "label": "Especialidades", "type": "repeater", "required": false, "min_items": 6, "item_fields": [
        { "key": "icono", "label": "Ícono (un emoji)", "type": "icon", "required": false },
        { "key": "titulo", "label": "Título", "type": "text", "max_length": 60 },
        { "key": "descripcion", "label": "Descripción", "type": "textarea", "max_length": 150 }
      ] },
      { "key": "obras_sociales", "label": "Obras sociales y prepagas", "type": "repeater", "required": false, "min_items": 3, "item_fields": [
        { "key": "nombre", "label": "Nombre", "type": "text", "max_length": 60 }
      ] },
      { "key": "testimonios", "label": "Testimonios de pacientes", "type": "repeater", "required": false, "min_items": 3, "item_fields": [
        { "key": "nombre", "label": "Nombre", "type": "text", "max_length": 60 },
        { "key": "cargo", "label": "Detalle (opcional)", "type": "text", "max_length": 60, "required": false },
        { "key": "texto", "label": "Testimonio", "type": "textarea", "max_length": 300 }
      ] }
    ]
  }'::jsonb
)
on conflict (slug) do nothing;

-- Definitive per-variant palette (calm/trust: sage green, lavender, soft
-- blue -- see research notes: blues/greens/muted earth tones test best for
-- mental-health branding; saturated/bright colors and red are avoided).
insert into public.templates (profession_id, name, slug, preview_image_url, config)
select p.id, t.name, t.slug, t.preview_image_url, t.config
from public.professions p
cross join (
  values
    ('Moderno', 'moderno', 'https://placehold.co/600x400?text=Moderno', '{"primaryColor": "#6b7f6b", "secondaryColor": "#6b7f6b", "layout": "modern"}'::jsonb),
    ('Clásico', 'clasico', 'https://placehold.co/600x400?text=Clasico', '{"primaryColor": "#5b6b8c", "secondaryColor": "#5b6b8c", "layout": "clasico"}'::jsonb),
    ('Minimal', 'minimal', 'https://placehold.co/600x400?text=Minimal', '{"primaryColor": "#8b7d9e", "secondaryColor": "#8b7d9e", "layout": "minimal"}'::jsonb)
) as t(name, slug, preview_image_url, config)
where p.slug = 'psicologos'
on conflict (profession_id, slug) do nothing;
