-- Second profession end to end: "Abogados", mirroring the contadores
-- pattern from 0008_contadores_wizard_fields.sql. Field list intentionally
-- stops short of everything templates/abogado*.html can display (no
-- testimonios, stats, or posgrado_2) -- see the conversation this shipped
-- in for why: those would need fabricated data with no real source today.
insert into public.professions (name, slug, form_schema)
values (
  'Abogados',
  'abogados',
  '{
    "fields": [
      { "key": "name", "label": "Nombre y apellido", "type": "text", "required": true, "min_length": 2, "max_length": 100 },
      { "key": "matricula_numero", "label": "Matrícula profesional", "type": "text", "required": true, "min_length": 1, "max_length": 50 },
      { "key": "matricula_colegio", "label": "Colegio / jurisdicción", "type": "text", "required": true, "min_length": 2, "max_length": 100 },
      { "key": "profile_image", "label": "Foto de perfil", "type": "image", "required": false },
      { "key": "phone", "label": "WhatsApp", "type": "whatsapp", "required": true },
      { "key": "email", "label": "Email de contacto", "type": "email", "required": false },
      { "key": "direccion", "label": "Dirección", "type": "text", "required": false, "max_length": 150 },
      { "key": "ciudad", "label": "Ciudad", "type": "text", "required": false, "max_length": 100 },
      { "key": "provincia", "label": "Provincia", "type": "text", "required": false, "max_length": 100 },
      { "key": "linkedin_url", "label": "LinkedIn (opcional)", "type": "text", "required": false, "max_length": 200 },
      { "key": "servicios", "label": "Áreas de práctica", "type": "checkbox-group", "required": true, "min_selected": 1, "options": [
        { "value": "familia", "label": "Derecho de Familia" },
        { "value": "sucesiones", "label": "Sucesiones" },
        { "value": "civil", "label": "Derecho Civil" },
        { "value": "laboral", "label": "Derecho Laboral" },
        { "value": "penal", "label": "Derecho Penal" },
        { "value": "societario", "label": "Derecho Societario" }
      ] },
      { "key": "descripcion_corta", "label": "Quiénes somos", "type": "textarea", "required": false, "max_length": 500 },
      { "key": "universidad", "label": "Universidad", "type": "text", "required": false, "max_length": 150 },
      { "key": "año_graduacion", "label": "Año de graduación", "type": "text", "required": false, "max_length": 10 },
      { "key": "asociacion_profesional", "label": "Asociación profesional", "type": "text", "required": false, "max_length": 150 }
    ]
  }'::jsonb
)
on conflict (slug) do nothing;

insert into public.templates (profession_id, name, slug, preview_image_url, config)
select p.id, t.name, t.slug, t.preview_image_url, t.config
from public.professions p
cross join (
  values
    ('Moderno', 'moderno', 'https://placehold.co/600x400?text=Moderno', '{"primaryColor": "#1C1C2E", "secondaryColor": "#C9A84C", "layout": "modern"}'::jsonb),
    ('Clásico', 'clasico', 'https://placehold.co/600x400?text=Clasico', '{"primaryColor": "#1A0A00", "secondaryColor": "#8B1A1A", "layout": "clasico"}'::jsonb),
    ('Minimal', 'minimal', 'https://placehold.co/600x400?text=Minimal', '{"primaryColor": "#0F0F0F", "secondaryColor": "#0F0F0F", "layout": "minimal"}'::jsonb)
) as t(name, slug, preview_image_url, config)
where p.slug = 'abogados'
on conflict (profession_id, slug) do nothing;
