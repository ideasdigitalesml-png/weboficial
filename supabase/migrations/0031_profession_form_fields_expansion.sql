-- Expands all three professions' form_schema with the fields requested for
-- this round of template/form improvements. Full literal replacement per
-- profession (not jsonb_set splicing) so the new schema is trivially
-- reviewable as one block, matching the style already used by
-- 0008_contadores_wizard_fields.sql / 0014_abogados_profession.sql /
-- 0023_psicologos_profession.sql.
--
-- Checked production data first (see conversation) -- only two things
-- needed backward-compat care:
--   1. abogados.servicios: the real landing "nocilkosaboda" has "societario"
--      selected. The new option list drops that label in favor of
--      "Comercial" (a closely related practice area), so the VALUE stays
--      "societario" (existing selections keep validating and stay checked)
--      -- only its LABEL changes. "Inmobiliario" and "Otros" are genuinely
--      new values.
--   2. psicologos.enfoque_terapeutico / obras_sociales: no landing has ever
--      set these (both null on every row), so converting the former to a
--      `select` and replacing the latter with acepta_obras_sociales +
--      obras_sociales_detalle is safe -- nothing to migrate.
-- contadores.especializacion is a brand new field, no compatibility concern.

update public.professions
set form_schema = '{
  "fields": [
    { "key": "name", "label": "Nombre y apellido", "type": "text", "required": true, "min_length": 2, "max_length": 100 },
    { "key": "matricula_numero", "label": "Matrícula profesional", "type": "text", "required": true, "min_length": 1, "max_length": 50, "placeholder": "Ej: 12.847" },
    { "key": "matricula_colegio", "label": "Colegio / jurisdicción", "type": "text", "required": true, "min_length": 2, "max_length": 100 },
    { "key": "profile_image", "label": "Foto de perfil", "type": "image", "required": false },
    { "key": "phone", "label": "WhatsApp", "type": "whatsapp", "required": true },
    { "key": "email", "label": "Email de contacto", "type": "email", "required": false },
    { "key": "direccion", "label": "Dirección", "type": "text", "required": false, "max_length": 150 },
    { "key": "ciudad", "label": "Ciudad", "type": "text", "required": false, "max_length": 100 },
    { "key": "provincia", "label": "Provincia", "type": "text", "required": false, "max_length": 100 },
    { "key": "zona", "label": "Zona de atención", "type": "text", "required": false, "max_length": 100, "placeholder": "Ej: CABA, GBA Norte, todo el país" },
    { "key": "modalidad", "label": "Modalidad de atención", "type": "select", "required": false, "options": [
      { "value": "presencial", "label": "Presencial" },
      { "value": "virtual", "label": "Virtual" },
      { "value": "ambas", "label": "Ambas" }
    ] },
    { "key": "linkedin_url", "label": "LinkedIn (opcional)", "type": "text", "required": false, "max_length": 200 },
    { "key": "servicios", "label": "Áreas de práctica", "type": "checkbox-group", "required": true, "min_selected": 1, "options": [
      { "value": "familia", "label": "Derecho de Familia" },
      { "value": "laboral", "label": "Derecho Laboral" },
      { "value": "penal", "label": "Derecho Penal" },
      { "value": "civil", "label": "Derecho Civil" },
      { "value": "societario", "label": "Comercial" },
      { "value": "sucesiones", "label": "Sucesiones" },
      { "value": "inmobiliario", "label": "Inmobiliario" },
      { "value": "otros", "label": "Otros" }
    ] },
    { "key": "descripcion_corta", "label": "Quiénes somos", "type": "textarea", "required": false, "max_length": 500 },
    { "key": "universidad", "label": "Universidad", "type": "text", "required": false, "max_length": 150 },
    { "key": "año_graduacion", "label": "Año de graduación", "type": "text", "required": false, "max_length": 10 },
    { "key": "asociacion_profesional", "label": "Asociación profesional", "type": "text", "required": false, "max_length": 150 },
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
      { "key": "cargo", "label": "Cargo / detalle (opcional)", "type": "text", "required": false, "max_length": 60 },
      { "key": "texto", "label": "Testimonio", "type": "textarea", "max_length": 300 }
    ] },
    { "key": "genero", "label": "Género", "type": "select", "required": false, "options": [
      { "value": "masculino", "label": "Masculino" },
      { "value": "femenino", "label": "Femenino" },
      { "value": "no_indica", "label": "Prefiero no indicar" }
    ] }
  ]
}'::jsonb
where slug = 'abogados';

update public.professions
set form_schema = '{
  "fields": [
    { "key": "name", "label": "Nombre y apellido", "type": "text", "required": true, "min_length": 2, "max_length": 100 },
    { "key": "matricula", "label": "Matrícula FACPCE", "type": "text", "required": true, "min_length": 1, "max_length": 50, "placeholder": "Ej: 12.847" },
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
      { "value": "asesoramiento_impositivo", "label": "Asesoramiento impositivo general" },
      { "value": "auditoria", "label": "Auditoría" }
    ] },
    { "key": "especializacion", "label": "Especialización", "type": "checkbox-group", "required": false, "options": [
      { "value": "monotributo_autonomos", "label": "Monotributo y Autónomos" },
      { "value": "pymes", "label": "PYMES" },
      { "value": "sociedades", "label": "Sociedades" },
      { "value": "ecommerce", "label": "E-commerce" },
      { "value": "auditoria", "label": "Auditoría" },
      { "value": "liquidacion_sueldos", "label": "Liquidación de Sueldos" }
    ] },
    { "key": "description", "label": "Quiénes somos", "type": "textarea", "required": false, "max_length": 800 },
    { "key": "titulo_profesional", "label": "Título profesional", "type": "text", "required": false, "max_length": 100 },
    { "key": "anos_experiencia", "label": "Años de experiencia", "type": "text", "required": false, "max_length": 10 },
    { "key": "cantidad_clientes", "label": "Cantidad de clientes atendidos", "type": "text", "required": false, "max_length": 20 },
    { "key": "linkedin_url", "label": "LinkedIn (opcional)", "type": "text", "required": false, "max_length": 200 },
    { "key": "instagram_url", "label": "Instagram (opcional)", "type": "text", "required": false, "max_length": 200 },
    { "key": "horario_atencion", "label": "Horario de atención", "type": "text", "required": false, "max_length": 150 },
    { "key": "slogan", "label": "Frase destacada / slogan", "type": "text", "required": false, "max_length": 150 },
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
      { "key": "cargo", "label": "Cargo / detalle (opcional)", "type": "text", "required": false, "max_length": 60 },
      { "key": "texto", "label": "Testimonio", "type": "textarea", "max_length": 300 }
    ] },
    { "key": "genero", "label": "Género", "type": "select", "required": false, "options": [
      { "value": "masculino", "label": "Masculino" },
      { "value": "femenino", "label": "Femenino" },
      { "value": "no_indica", "label": "Prefiero no indicar" }
    ] }
  ]
}'::jsonb
where slug = 'contadores';

update public.professions
set form_schema = '{
  "fields": [
    { "key": "name", "label": "Nombre y apellido", "type": "text", "required": true, "min_length": 2, "max_length": 100 },
    { "key": "titulo_profesional", "label": "Título profesional", "type": "text", "required": true, "min_length": 2, "max_length": 100 },
    { "key": "matricula_numero", "label": "Matrícula profesional", "type": "text", "required": true, "min_length": 1, "max_length": 50, "placeholder": "Ej: 12.847" },
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
    { "key": "enfoque_terapeutico", "label": "Corriente terapéutica", "type": "select", "required": false, "options": [
      { "value": "cognitivo_conductual", "label": "Cognitivo-Conductual" },
      { "value": "psicoanalitica", "label": "Psicoanalítica" },
      { "value": "sistemica", "label": "Sistémica" },
      { "value": "gestalt", "label": "Gestalt" },
      { "value": "integrativa", "label": "Integrativa" },
      { "value": "otra", "label": "Otra" }
    ] },
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
    { "key": "poblacion_atendida", "label": "Población que atiende", "type": "checkbox-group", "required": false, "options": [
      { "value": "adultos", "label": "Adultos" },
      { "value": "adolescentes", "label": "Adolescentes" },
      { "value": "ninos", "label": "Niños" },
      { "value": "parejas", "label": "Parejas" },
      { "value": "familias", "label": "Familias" }
    ] },
    { "key": "acepta_obras_sociales", "label": "¿Acepta obras sociales?", "type": "select", "required": false, "options": [
      { "value": "si", "label": "Sí" },
      { "value": "no", "label": "No" }
    ] },
    { "key": "obras_sociales_detalle", "label": "¿Cuáles obras sociales?", "type": "textarea", "required": false, "max_length": 300, "placeholder": "Ej: OSDE, Swiss Medical, Galeno" },
    { "key": "testimonios", "label": "Testimonios de pacientes", "type": "repeater", "required": false, "min_items": 3, "item_fields": [
      { "key": "nombre", "label": "Nombre", "type": "text", "max_length": 60 },
      { "key": "cargo", "label": "Detalle (opcional)", "type": "text", "required": false, "max_length": 60 },
      { "key": "texto", "label": "Testimonio", "type": "textarea", "max_length": 300 }
    ] },
    { "key": "genero", "label": "Género", "type": "select", "required": false, "options": [
      { "value": "masculino", "label": "Masculino" },
      { "value": "femenino", "label": "Femenino" },
      { "value": "no_indica", "label": "Prefiero no indicar" }
    ] }
  ]
}'::jsonb
where slug = 'psicologos';
