-- Psicologo wizard/form UX fixes:
--   1. precio_consulta gets a visual "$" prefix hint (FieldInput renders it,
--      never stored -- the field itself stays a plain text value).
--   2. especialidades stays required:false (no schema change needed here --
--      the actual blocker was the wizard's client-side step-gate, fixed in
--      PsicologoWizard.tsx, not the schema).
--   3. New enfoque_terapeutico_custom field for the "Otra" corriente
--      terapéutica case.
-- No production psicologo landings exist yet (checked via execute_sql), so
-- this is a plain schema replacement with no backfill concerns.
update professions
set form_schema = '{
  "fields": [
    { "key": "name", "type": "text", "label": "Nombre y apellido", "required": true, "max_length": 100, "min_length": 2 },
    { "key": "titulo_profesional", "type": "text", "label": "Título profesional", "required": true, "max_length": 100, "min_length": 2 },
    { "key": "matricula_numero", "type": "text", "label": "Matrícula profesional", "required": true, "max_length": 50, "min_length": 1, "placeholder": "Ej: 12.847" },
    { "key": "profile_image", "type": "image", "label": "Foto de perfil", "required": false },
    { "key": "phone", "type": "whatsapp", "label": "WhatsApp", "required": true },
    { "key": "email", "type": "email", "label": "Email de contacto", "required": false },
    { "key": "direccion", "type": "text", "label": "Zona / consultorio (opcional)", "required": false, "max_length": 150 },
    { "key": "horario_atencion", "type": "text", "label": "Horario de atención", "required": false, "max_length": 150 },
    { "key": "modalidad", "type": "select", "label": "Modalidad de atención", "required": false, "options": [
      { "label": "Presencial", "value": "presencial" },
      { "label": "Online", "value": "online" },
      { "label": "Presencial y online", "value": "ambas" }
    ] },
    { "key": "enfoque_terapeutico", "type": "select", "label": "Corriente terapéutica", "required": false, "options": [
      { "label": "Cognitivo-Conductual", "value": "cognitivo_conductual" },
      { "label": "Psicoanalítica", "value": "psicoanalitica" },
      { "label": "Sistémica", "value": "sistemica" },
      { "label": "Gestalt", "value": "gestalt" },
      { "label": "Integrativa", "value": "integrativa" },
      { "label": "Otra", "value": "otra" }
    ] },
    { "key": "enfoque_terapeutico_custom", "type": "text", "label": "¿Cuál es tu corriente terapéutica?", "required": false, "max_length": 100, "placeholder": "Ej: Terapia narrativa" },
    { "key": "descripcion", "type": "textarea", "label": "Presentación personal", "required": false, "max_length": 800 },
    { "key": "precio_consulta", "type": "text", "label": "Precio de consulta (opcional)", "required": false, "max_length": 50, "prefix": "$" },
    { "key": "cta_text", "type": "text", "label": "Texto del botón principal", "required": false, "max_length": 40 },
    { "key": "linkedin_url", "type": "text", "label": "LinkedIn (opcional)", "required": false, "max_length": 200 },
    { "key": "instagram_url", "type": "text", "label": "Instagram (opcional)", "required": false, "max_length": 200 },
    { "key": "especialidades", "type": "repeater", "label": "Especialidades", "required": false, "min_items": 6, "item_fields": [
      { "key": "icono", "type": "icon", "label": "Ícono (un emoji)", "required": false },
      { "key": "titulo", "type": "text", "label": "Título", "max_length": 60 },
      { "key": "descripcion", "type": "textarea", "label": "Descripción", "max_length": 150 }
    ] },
    { "key": "poblacion_atendida", "type": "checkbox-group", "label": "Población que atiende", "required": false, "options": [
      { "label": "Adultos", "value": "adultos" },
      { "label": "Adolescentes", "value": "adolescentes" },
      { "label": "Niños", "value": "ninos" },
      { "label": "Parejas", "value": "parejas" },
      { "label": "Familias", "value": "familias" }
    ] },
    { "key": "acepta_obras_sociales", "type": "select", "label": "¿Acepta obras sociales?", "required": false, "options": [
      { "label": "Sí", "value": "si" },
      { "label": "No", "value": "no" }
    ] },
    { "key": "obras_sociales_detalle", "type": "textarea", "label": "¿Cuáles obras sociales?", "required": false, "max_length": 300, "placeholder": "Ej: OSDE, Swiss Medical, Galeno" },
    { "key": "testimonios", "type": "repeater", "label": "Testimonios de pacientes", "required": false, "min_items": 3, "item_fields": [
      { "key": "nombre", "type": "text", "label": "Nombre", "max_length": 60 },
      { "key": "cargo", "type": "text", "label": "Detalle (opcional)", "required": false, "max_length": 60 },
      { "key": "texto", "type": "textarea", "label": "Testimonio", "max_length": 300 }
    ] },
    { "key": "genero", "type": "select", "label": "Género", "required": false, "options": [
      { "label": "Masculino", "value": "masculino" },
      { "label": "Femenino", "value": "femenino" },
      { "label": "Prefiero no indicar", "value": "no_indica" }
    ] }
  ]
}'::jsonb
where slug = 'psicologos';
