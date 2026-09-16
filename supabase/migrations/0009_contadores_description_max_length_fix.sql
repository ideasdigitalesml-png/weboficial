-- The suggested "quiénes somos" text (built from the services checklist) can
-- run well past 400 characters when someone ticks most/all 8 services --
-- 400 is only the guardrail applied client-side to the free-text path, not
-- a ceiling the generated suggestion itself must fit under.
update public.professions
set form_schema = jsonb_set(
  form_schema,
  '{fields}',
  (
    select jsonb_agg(
      case when field->>'key' = 'description'
        then jsonb_set(field, '{max_length}', '800')
        else field
      end
    )
    from jsonb_array_elements(form_schema->'fields') as field
  )
)
where slug = 'contadores';
