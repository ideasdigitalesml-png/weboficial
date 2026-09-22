-- Synced from production (applied 2026-09-22, missing from this repo until now).
update professions
set form_schema = jsonb_set(
  form_schema,
  '{fields}',
  (
    select jsonb_agg(
      case
        when field->>'key' = 'servicios' then
          jsonb_set(
            field,
            '{options}',
            (field->'options') || '[{"label":"Auditoría","value":"auditoria"}]'::jsonb
          )
        else field
      end
    )
    from jsonb_array_elements(form_schema->'fields') as field
  ) || '[
    {"key":"titulo_profesional","type":"text","label":"Título profesional","required":false,"max_length":100},
    {"key":"anos_experiencia","type":"text","label":"Años de experiencia","required":false,"max_length":10},
    {"key":"cantidad_clientes","type":"text","label":"Cantidad de clientes atendidos","required":false,"max_length":20},
    {"key":"linkedin_url","type":"text","label":"LinkedIn (opcional)","required":false,"max_length":200},
    {"key":"instagram_url","type":"text","label":"Instagram (opcional)","required":false,"max_length":200},
    {"key":"horario_atencion","type":"text","label":"Horario de atención","required":false,"max_length":150},
    {"key":"slogan","type":"text","label":"Frase destacada / slogan","required":false,"max_length":150}
  ]'::jsonb
)
where slug = 'contadores';
