insert into public.plans (name, amount, currency, frequency, active)
values ('basic', 25000, 'ARS', 'monthly', true)
on conflict (name) do nothing;

insert into public.professions (name, slug, form_schema)
values (
  'Contadores',
  'contadores',
  '{
    "fields": [
      { "key": "name", "label": "Nombre completo", "type": "text", "required": true, "min_length": 2, "max_length": 100 },
      { "key": "professional_title", "label": "Título profesional", "type": "text", "required": true, "min_length": 2, "max_length": 100 },
      { "key": "description", "label": "Descripción", "type": "textarea", "required": true, "min_length": 10, "max_length": 600 },
      { "key": "phone", "label": "WhatsApp", "type": "phone", "required": true },
      { "key": "email", "label": "Email", "type": "email", "required": true },
      { "key": "profile_image", "label": "Foto de perfil", "type": "image", "required": true }
    ]
  }'::jsonb
)
on conflict (slug) do nothing;

insert into public.templates (profession_id, name, slug, preview_image_url, config)
select p.id, t.name, t.slug, t.preview_image_url, t.config
from public.professions p
cross join (
  values
    ('Clásico', 'clasico', 'https://placehold.co/600x400?text=Clasico', '{"primaryColor": "#0f172a", "layout": "classic"}'::jsonb),
    ('Moderno', 'moderno', 'https://placehold.co/600x400?text=Moderno', '{"primaryColor": "#2563eb", "layout": "modern"}'::jsonb),
    ('Minimal', 'minimal', 'https://placehold.co/600x400?text=Minimal', '{"primaryColor": "#18181b", "layout": "minimal"}'::jsonb)
) as t(name, slug, preview_image_url, config)
where p.slug = 'contadores'
on conflict (profession_id, slug) do nothing;

insert into public.stock_images (profession_id, category, image_url)
select null, 'perfil', url
from unnest(array[
  'https://i.pravatar.cc/300?img=11',
  'https://i.pravatar.cc/300?img=12',
  'https://i.pravatar.cc/300?img=13',
  'https://i.pravatar.cc/300?img=14',
  'https://i.pravatar.cc/300?img=15',
  'https://i.pravatar.cc/300?img=16'
]) as url
on conflict (image_url) do nothing;

insert into public.stock_images (profession_id, category, image_url)
select null, 'lugar', url
from unnest(array[
  'https://picsum.photos/seed/oficina1/600/400',
  'https://picsum.photos/seed/oficina2/600/400',
  'https://picsum.photos/seed/oficina3/600/400',
  'https://picsum.photos/seed/oficina4/600/400',
  'https://picsum.photos/seed/oficina5/600/400',
  'https://picsum.photos/seed/oficina6/600/400'
]) as url
on conflict (image_url) do nothing;
