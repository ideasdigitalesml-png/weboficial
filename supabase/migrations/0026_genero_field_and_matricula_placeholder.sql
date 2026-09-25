-- Two UX fixes bundled in one migration since both only touch
-- professions.form_schema:
--
-- 1. Adds a "genero" select field (masculino/femenino/prefiero no indicar)
--    to all three professions, used by the onboarding wizards' suggested-bio
--    generators (getSuggestedContadorText/AbogadoText/PsicologoText) to say
--    "contador"/"contadora" instead of a fixed or slashed "contador/a" form.
--    Not required -- a professional who skips it gets the ungendered/neutral
--    wording, same as "no_indica".
-- 2. Sets a `placeholder` UI hint (see FormFieldSchema.placeholder in
--    validate-form-data.ts) on each profession's matricula field so the
--    wizard shows a realistic example instead of a blank box.

update public.professions
set form_schema = jsonb_set(
  form_schema,
  '{fields}',
  (
    select jsonb_agg(
      case when field->>'key' = 'matricula'
        then field || jsonb_build_object('placeholder', 'Ej: 12.847')
        else field
      end
    )
    from jsonb_array_elements(form_schema->'fields') as field
  ) || jsonb_build_array(jsonb_build_object(
    'key', 'genero',
    'label', 'Género',
    'type', 'select',
    'required', false,
    'options', jsonb_build_array(
      jsonb_build_object('value', 'masculino', 'label', 'Masculino'),
      jsonb_build_object('value', 'femenino', 'label', 'Femenino'),
      jsonb_build_object('value', 'no_indica', 'label', 'Prefiero no indicar')
    )
  ))
)
where slug = 'contadores';

update public.professions
set form_schema = jsonb_set(
  form_schema,
  '{fields}',
  (
    select jsonb_agg(
      case when field->>'key' = 'matricula_numero'
        then field || jsonb_build_object('placeholder', 'Ej: 12.847')
        else field
      end
    )
    from jsonb_array_elements(form_schema->'fields') as field
  ) || jsonb_build_array(jsonb_build_object(
    'key', 'genero',
    'label', 'Género',
    'type', 'select',
    'required', false,
    'options', jsonb_build_array(
      jsonb_build_object('value', 'masculino', 'label', 'Masculino'),
      jsonb_build_object('value', 'femenino', 'label', 'Femenino'),
      jsonb_build_object('value', 'no_indica', 'label', 'Prefiero no indicar')
    )
  ))
)
where slug = 'abogados';

update public.professions
set form_schema = jsonb_set(
  form_schema,
  '{fields}',
  (
    select jsonb_agg(
      case when field->>'key' = 'matricula_numero'
        then field || jsonb_build_object('placeholder', 'Ej: 12.847')
        else field
      end
    )
    from jsonb_array_elements(form_schema->'fields') as field
  ) || jsonb_build_array(jsonb_build_object(
    'key', 'genero',
    'label', 'Género',
    'type', 'select',
    'required', false,
    'options', jsonb_build_array(
      jsonb_build_object('value', 'masculino', 'label', 'Masculino'),
      jsonb_build_object('value', 'femenino', 'label', 'Femenino'),
      jsonb_build_object('value', 'no_indica', 'label', 'Prefiero no indicar')
    )
  ))
)
where slug = 'psicologos';
