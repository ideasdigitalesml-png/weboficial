-- The main WhatsApp CTA button text is now fixed as "Contactame" across all
-- 9 real templates (abogado/contador/psicologo x moderno/clasico/minimal),
-- hardcoded in each template component. The cta_text field is removed from
-- every profession's form_schema so it no longer appears in the onboarding
-- wizard or the generic /dashboard/editar form (EditLandingForm.tsx renders
-- one FieldInput per schema field, so dropping it here is enough).
-- No production landing has a cta_text value saved (checked via
-- execute_sql), so this is a plain schema replacement with no backfill.
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

update professions
set form_schema = '{
  "fields": [
    { "key": "name", "type": "text", "label": "Nombre y apellido", "required": true, "max_length": 100, "min_length": 2 },
    { "key": "matricula_numero", "type": "text", "label": "Matrícula profesional", "required": true, "max_length": 50, "min_length": 1, "placeholder": "Ej: 12.847" },
    { "key": "matricula_colegio", "type": "text", "label": "Colegio / jurisdicción", "required": true, "max_length": 100, "min_length": 2 },
    { "key": "profile_image", "type": "image", "label": "Foto de perfil", "required": false },
    { "key": "phone", "type": "whatsapp", "label": "WhatsApp", "required": true },
    { "key": "email", "type": "email", "label": "Email de contacto", "required": false },
    { "key": "direccion", "type": "text", "label": "Dirección", "required": false, "max_length": 150 },
    { "key": "ciudad", "type": "text", "label": "Ciudad", "required": false, "max_length": 100 },
    { "key": "provincia", "type": "text", "label": "Provincia", "required": false, "max_length": 100 },
    { "key": "zona", "type": "text", "label": "Zona de atención", "required": false, "max_length": 100, "placeholder": "Ej: CABA, GBA Norte, todo el país" },
    { "key": "modalidad", "type": "select", "label": "Modalidad de atención", "required": false, "options": [
      { "label": "Presencial", "value": "presencial" },
      { "label": "Virtual", "value": "virtual" },
      { "label": "Ambas", "value": "ambas" }
    ] },
    { "key": "linkedin_url", "type": "text", "label": "LinkedIn (opcional)", "required": false, "max_length": 200 },
    { "key": "servicios", "type": "checkbox-group", "label": "Áreas de práctica", "required": true, "min_selected": 1, "options": [
      { "label": "Derecho de Familia", "value": "familia" },
      { "label": "Derecho Laboral", "value": "laboral" },
      { "label": "Derecho Penal", "value": "penal" },
      { "label": "Derecho Civil", "value": "civil" },
      { "label": "Comercial", "value": "societario" },
      { "label": "Sucesiones", "value": "sucesiones" },
      { "label": "Inmobiliario", "value": "inmobiliario" },
      { "label": "Otros", "value": "otros" }
    ] },
    { "key": "descripcion_corta", "type": "textarea", "label": "Quiénes somos", "required": false, "max_length": 500 },
    { "key": "universidad", "type": "text", "label": "Universidad", "required": false, "max_length": 150 },
    { "key": "año_graduacion", "type": "text", "label": "Año de graduación", "required": false, "max_length": 10 },
    { "key": "asociacion_profesional", "type": "text", "label": "Asociación profesional", "required": false, "max_length": 150 },
    { "key": "slogan", "type": "text", "label": "Frase / slogan", "required": false, "max_length": 150 },
    { "key": "horario_atencion", "type": "text", "label": "Horario de atención", "required": false, "max_length": 150 },
    { "key": "instagram_url", "type": "text", "label": "Instagram (opcional)", "required": false, "max_length": 200 },
    { "key": "anos_experiencia", "type": "text", "label": "Años de experiencia", "required": false, "max_length": 10 },
    { "key": "servicios_detallados", "type": "repeater", "label": "Servicios / especialidades", "required": false, "min_items": 6, "item_fields": [
      { "key": "icono", "type": "icon", "label": "Ícono (un emoji)", "required": false },
      { "key": "titulo", "type": "text", "label": "Título", "max_length": 60 },
      { "key": "descripcion", "type": "textarea", "label": "Descripción", "max_length": 150 }
    ] },
    { "key": "por_que_elegirnos", "type": "repeater", "label": "Por qué elegirnos", "required": false, "max_items": 4, "min_items": 3, "item_fields": [
      { "key": "icono", "type": "icon", "label": "Ícono (un emoji)", "required": false },
      { "key": "titulo", "type": "text", "label": "Punto destacado", "max_length": 80 }
    ] },
    { "key": "testimonios", "type": "repeater", "label": "Testimonios de clientes", "required": false, "min_items": 3, "item_fields": [
      { "key": "nombre", "type": "text", "label": "Nombre del cliente", "max_length": 60 },
      { "key": "cargo", "type": "text", "label": "Cargo / detalle (opcional)", "required": false, "max_length": 60 },
      { "key": "texto", "type": "textarea", "label": "Testimonio", "max_length": 300 }
    ] },
    { "key": "genero", "type": "select", "label": "Género", "required": false, "options": [
      { "label": "Masculino", "value": "masculino" },
      { "label": "Femenino", "value": "femenino" },
      { "label": "Prefiero no indicar", "value": "no_indica" }
    ] }
  ]
}'::jsonb
where slug = 'abogados';

update professions
set form_schema = '{
  "fields": [
    { "key": "name", "type": "text", "label": "Nombre y apellido", "required": true, "max_length": 100, "min_length": 2 },
    { "key": "matricula", "type": "text", "label": "Matrícula FACPCE", "required": true, "max_length": 50, "min_length": 1, "placeholder": "Ej: 12.847" },
    { "key": "jurisdiccion", "type": "text", "label": "Jurisdicción / Consejo profesional", "required": true, "max_length": 100, "min_length": 2 },
    { "key": "profile_image", "type": "image", "label": "Foto de perfil", "required": false },
    { "key": "phone", "type": "whatsapp", "label": "WhatsApp", "required": true },
    { "key": "email", "type": "email", "label": "Email de contacto adicional", "required": false },
    { "key": "zona", "type": "text", "label": "Zona / ubicación de atención", "required": false, "max_length": 100 },
    { "key": "modalidad", "type": "select", "label": "Modalidad de atención", "required": false, "options": [
      { "label": "Presencial", "value": "presencial" },
      { "label": "Remoto", "value": "remoto" },
      { "label": "Ambos", "value": "ambos" }
    ] },
    { "key": "servicios", "type": "checkbox-group", "label": "Servicios", "required": true, "min_selected": 1, "options": [
      { "label": "Monotributo", "value": "monotributo" },
      { "label": "IVA", "value": "iva" },
      { "label": "Impuesto a las Ganancias", "value": "ganancias" },
      { "label": "Bienes Personales", "value": "bienes_personales" },
      { "label": "Liquidación de sueldos", "value": "liquidacion_sueldos" },
      { "label": "Constitución de sociedades", "value": "constitucion_sociedades" },
      { "label": "Balances y estados contables", "value": "balances" },
      { "label": "Asesoramiento impositivo general", "value": "asesoramiento_impositivo" },
      { "label": "Auditoría", "value": "auditoria" }
    ] },
    { "key": "especializacion", "type": "checkbox-group", "label": "Especialización", "required": false, "options": [
      { "label": "Monotributo y Autónomos", "value": "monotributo_autonomos" },
      { "label": "PYMES", "value": "pymes" },
      { "label": "Sociedades", "value": "sociedades" },
      { "label": "E-commerce", "value": "ecommerce" },
      { "label": "Auditoría", "value": "auditoria" },
      { "label": "Liquidación de Sueldos", "value": "liquidacion_sueldos" }
    ] },
    { "key": "description", "type": "textarea", "label": "Quiénes somos", "required": false, "max_length": 800 },
    { "key": "titulo_profesional", "type": "text", "label": "Título profesional", "required": false, "max_length": 100 },
    { "key": "anos_experiencia", "type": "text", "label": "Años de experiencia", "required": false, "max_length": 10 },
    { "key": "cantidad_clientes", "type": "text", "label": "Cantidad de clientes atendidos", "required": false, "max_length": 20 },
    { "key": "linkedin_url", "type": "text", "label": "LinkedIn (opcional)", "required": false, "max_length": 200 },
    { "key": "instagram_url", "type": "text", "label": "Instagram (opcional)", "required": false, "max_length": 200 },
    { "key": "horario_atencion", "type": "text", "label": "Horario de atención", "required": false, "max_length": 150 },
    { "key": "slogan", "type": "text", "label": "Frase destacada / slogan", "required": false, "max_length": 150 },
    { "key": "direccion", "type": "text", "label": "Dirección (opcional)", "required": false, "max_length": 150 },
    { "key": "servicios_detallados", "type": "repeater", "label": "Servicios / especialidades", "required": false, "min_items": 6, "item_fields": [
      { "key": "icono", "type": "icon", "label": "Ícono (un emoji)", "required": false },
      { "key": "titulo", "type": "text", "label": "Título", "max_length": 60 },
      { "key": "descripcion", "type": "textarea", "label": "Descripción", "max_length": 150 }
    ] },
    { "key": "por_que_elegirnos", "type": "repeater", "label": "Por qué elegirnos", "required": false, "max_items": 4, "min_items": 3, "item_fields": [
      { "key": "icono", "type": "icon", "label": "Ícono (un emoji)", "required": false },
      { "key": "titulo", "type": "text", "label": "Punto destacado", "max_length": 80 }
    ] },
    { "key": "testimonios", "type": "repeater", "label": "Testimonios de clientes", "required": false, "min_items": 3, "item_fields": [
      { "key": "nombre", "type": "text", "label": "Nombre del cliente", "max_length": 60 },
      { "key": "cargo", "type": "text", "label": "Cargo / detalle (opcional)", "required": false, "max_length": 60 },
      { "key": "texto", "type": "textarea", "label": "Testimonio", "max_length": 300 }
    ] },
    { "key": "genero", "type": "select", "label": "Género", "required": false, "options": [
      { "label": "Masculino", "value": "masculino" },
      { "label": "Femenino", "value": "femenino" },
      { "label": "Prefiero no indicar", "value": "no_indica" }
    ] }
  ]
}'::jsonb
where slug = 'contadores';
