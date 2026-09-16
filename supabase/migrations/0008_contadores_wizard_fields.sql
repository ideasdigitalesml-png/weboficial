-- Replaces the placeholder "Contadores" form_schema from the 0003 seed with
-- the real field set needed by the dedicated contador wizard: matricula +
-- jurisdiccion (legally load-bearing per market research), a normalized
-- whatsapp field (country code baked into the stored value so it can be
-- turned into a wa.me link directly), a checkbox-group of predefined
-- services, and the optional zona/modalidad fields. profile_image, email and
-- description move from required to optional -- publishing no longer blocks
-- on them. professional_title is dropped: the template now renders a fixed
-- "Contador Público matriculado" label next to matricula instead.
--
-- Field types "whatsapp", "checkbox-group" and "select" are new -- see the
-- corresponding additions to FormFieldType in
-- src/lib/forms/validate-form-data.ts. Existing landings already created
-- against the old schema are untouched by this migration; their form_data
-- simply won't have the new keys until the contador re-saves from the
-- (also updated) dashboard edit form.
update public.professions
set form_schema = '{
  "fields": [
    { "key": "name", "label": "Nombre y apellido", "type": "text", "required": true, "min_length": 2, "max_length": 100 },
    { "key": "matricula", "label": "Matrícula profesional", "type": "text", "required": true, "min_length": 1, "max_length": 50 },
    { "key": "jurisdiccion", "label": "Jurisdicción / Consejo profesional", "type": "text", "required": true, "min_length": 2, "max_length": 100 },
    { "key": "profile_image", "label": "Foto de perfil", "type": "image", "required": false },
    { "key": "phone", "label": "WhatsApp", "type": "whatsapp", "required": true },
    { "key": "email", "label": "Email de contacto adicional", "type": "email", "required": false },
    { "key": "zona", "label": "Zona / ubicación de atención", "type": "text", "required": false, "max_length": 100 },
    { "key": "modalidad", "label": "Modalidad de atención", "type": "select", "required": false, "options": [
      { "value": "presencial", "label": "Presencial" },
      { "value": "remoto", "label": "Remoto" },
      { "value": "ambos", "label": "Ambos" }
    ] },
    { "key": "servicios", "label": "Servicios", "type": "checkbox-group", "required": true, "min_selected": 1, "options": [
      { "value": "monotributo", "label": "Monotributo" },
      { "value": "iva", "label": "IVA" },
      { "value": "ganancias", "label": "Impuesto a las Ganancias" },
      { "value": "bienes_personales", "label": "Bienes Personales" },
      { "value": "liquidacion_sueldos", "label": "Liquidación de sueldos" },
      { "value": "constitucion_sociedades", "label": "Constitución de sociedades" },
      { "value": "balances", "label": "Balances y estados contables" },
      { "value": "asesoramiento_impositivo", "label": "Asesoramiento impositivo general" }
    ] },
    { "key": "description", "label": "Quiénes somos", "type": "textarea", "required": false, "max_length": 400 }
  ]
}'::jsonb
where slug = 'contadores';
