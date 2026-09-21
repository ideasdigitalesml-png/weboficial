# MARKETING_BRIEF.md — weboficial.com.ar

> **Para:** Especialista en marketing (IA o humano) que creará campañas, textos y prompts de imágenes publicitarias.
> **De:** Analista técnico del proyecto.
> **Reglas de este documento:** Solo describe lo que existe hoy en el código. Las secciones marcadas con ⚠️ INCOMPLETO o 🔲 SOLO PLANEADO son honestas: no publiques ni uses esas partes en campañas hasta confirmar con el equipo.

---

## 1. QUÉ ES EL PRODUCTO

**weboficial.com.ar** es un servicio web que genera páginas profesionales para profesionales argentinos (contadores y abogados, por ahora) en minutos, sin que el usuario necesite saber programar ni diseñar.

El usuario completa un formulario guiado, elige un diseño, paga con Mercado Pago y obtiene su página en un subdominio propio (`nombre.weboficial.com.ar`). Puede editar sus datos cuando quiera desde un panel.

**No es un constructor de páginas drag-and-drop.** No es Wix, no es WordPress. Es un producto especializado: el sistema conoce qué información necesita cada profesión y genera una página limpia y completa automáticamente.

---

## 2. PROBLEMA QUE RESUELVE

Los profesionales independientes argentinos (contadores, abogados, psicólogos, etc.) no tienen presencia web porque:

1. Crear un sitio desde cero requiere conocimientos técnicos que no tienen.
2. Los constructores de páginas genéricos (Wix, WordPress) son complicados y genéricos.
3. Contratar un desarrollador o diseñador es caro y lento.
4. Las redes sociales no reemplazan un sitio propio: no transmiten la misma seriedad profesional.

**weboficial** resuelve exactamente eso: en minutos, sin conocimientos técnicos, a un precio accesible.

---

## 3. PÚBLICO OBJETIVO

### Perfil primario (lo que el código soporta hoy)

| Profesión | Estado |
|---|---|
| Contadores | ✅ FUNCIONA HOY — wizard completo, 3 plantillas, 4 paletas de color |
| Abogados | ✅ FUNCIONA HOY — wizard completo, 3 plantillas, 4 paletas de color |

### Perfil secundario (mencionado en el proyecto pero sin código todavía)

| Profesión | Estado |
|---|---|
| Psicólogos | 🔲 SOLO PLANEADO — no existe código, no existe wizard, no existe plantilla |

### Características del cliente ideal (inferido del producto)

- Profesional independiente o en estudio pequeño
- Argentino (precio en ARS, Mercado Pago como único medio de pago)
- Con al menos un dispositivo con internet (el flujo es 100% web)
- Sin tiempo o interés en aprender herramientas de diseño
- Quiere transmitir seriedad y profesionalismo a sus clientes

---

## 4. PROPUESTA DE VALOR CENTRAL

**Tagline oficial (está en el código):**
> "Tu página profesional, lista en minutos."

**Subtítulo oficial (está en el código):**
> "Sin programar, sin complicaciones. Elegís tu diseño, completás tus datos y listo."

### Pilares de valor que el producto cumple HOY:

1. **Velocidad** — El flujo completo (formulario + pago) se hace en una sola sesión.
2. **Especialización** — El formulario sabe exactamente qué datos pide un contador o un abogado (matrícula, jurisdicción, áreas de práctica, etc.). No es genérico.
3. **Diseño profesional** — Plantillas con tipografías premium (Instrument Serif, Libre Baskerville, Inter) y paletas de color curadas. No parece un template genérico.
4. **Subdominio propio** — La página queda en `slug.weboficial.com.ar`, no en una URL compartida.
5. **Edición libre** — El usuario puede cambiar sus datos, secciones y colores desde el panel cuando quiera.
6. **Precio accesible y sin sorpresas** — Un único plan, un único precio.

---

## 5. PRECIO Y MODELO DE NEGOCIO

### Lo que existe hoy en el código:

- **Un solo plan:** "basic"
- **Precio:** ARS $25.000 por mes
- **Forma de pago:** Mercado Pago exclusivamente (preaprobación/débito automático — suscripción recurrente)
- **Cancelación:** El sistema está construido para cancelar cuando se quiera (el texto del sitio dice "Cancelá cuando quieras, sin compromiso.")
- **Qué incluye según el sitio:** "Tu dominio, hosting y todas las ediciones que necesites."

### ⚠️ INCOMPLETO:

- No hay período de prueba gratuita en el código.
- No hay descuento anual ni otros planes.
- No hay cupones de descuento implementados.

---

## 6. FLUJO DEL USUARIO (de cero a página publicada)

Este es el flujo real tal como está programado:

### Paso 1 — Visitante en la home
Llega a weboficial.com.ar. Ve el titular, el subtítulo, cómo funciona y el precio. Hay un botón principal de llamada a la acción.

### Paso 2 — Selecciona profesión
Elige entre las profesiones disponibles (hoy: Contador o Abogado).

### Paso 3 — Selecciona plantilla
Elige entre 3 diseños con preview visual:
- **Moderno** (diseño oscuro con tipografía de display elegante)
- **Clásico** (diseño más tradicional y limpio)
- **Minimal** (mínimo, directo)

### Paso 4 — Completa el formulario guiado (Wizard)
El wizard tiene 5 sub-pasos. En todo momento hay un preview en vivo de cómo va quedando la página.

**Para contadores:**
1. Datos: nombre, matrícula, jurisdicción, foto de perfil
2. Contacto: teléfono/WhatsApp, email, zona, modalidad (presencial/virtual/ambas)
3. Servicios: selección múltiple de los servicios que ofrece
4. Descripción personal: texto "quiénes somos" (sugerido o personalizable)
5. Revisión: vista final + elección del slug (URL)

**Para abogados:**
1. Datos: nombre, número de matrícula, colegio de matrícula, foto de perfil
2. Contacto: teléfono, email, dirección, ciudad, provincia, LinkedIn
3. Servicios: áreas de práctica (selección múltiple)
4. Sobre mí: descripción, universidad, año de graduación, asociación profesional
5. Revisión: vista final + elección del slug (URL)

### Paso 5 — Pago con Mercado Pago
Al finalizar el wizard, el sistema crea la landing en estado "borrador" y redirige al usuario a Mercado Pago para iniciar la suscripción mensual.

### Paso 6 — Página activa
Cuando Mercado Pago confirma el pago, la landing pasa a estado "activa" y ya es visible en `slug.weboficial.com.ar`.

### Paso 7 — Panel de control
El usuario puede volver en cualquier momento, iniciar sesión con Google, y desde su panel:
- Editar sus datos y secciones
- Cambiar la paleta de colores (4 opciones por plantilla)
- Ver el estado de su suscripción

---

## 7. AUTENTICACIÓN

- **Único método:** Google OAuth (botón "Iniciar sesión con Google")
- No hay registro con email/contraseña.
- El link para iniciar sesión está en el encabezado de la home (arriba a la derecha, discreto).
- También hay un botón en el panel si el usuario ya tiene cuenta.

---

## 8. LAS PLANTILLAS Y DISEÑOS

### Contadores

| Plantilla | Descripción visual |
|---|---|
| **Moderno** | Fondo oscuro (navy profundo), tipografía Instrument Serif para display + Inter para cuerpo, foto circular, secciones bien diferenciadas. Sofisticado. |
| **Clásico** | Diseño más tradicional, limpio. Colores más claros. |
| **Minimal** | Minimalista, directo al punto. |

**Paletas disponibles para Contador Moderno:**
- **Bosque** — Navy #0B2545 + Verde #1A6B4A (predeterminada)
- **Marino** — Navy #1A3A5C + Azul #2E86C1
- **Carbono** — Negro #1C1C2E + Rojo #E63946
- **Tierra** — Marrón #3D2B1F + Terracota #C0783C

### Abogados

| Plantilla | Descripción visual |
|---|---|
| **Moderno** | Fondo oscuro navy (#1C1C2E), tipografía Libre Baskerville para display + Inter para cuerpo. Elegante, serio. |
| **Clásico** | ✅ existe, misma base visual con ajustes |
| **Minimal** | ✅ existe, versión reducida |

**Paletas disponibles para Abogado Moderno:**
- **Bosque** — Negro #1C1C2E + Verde #1A6B4A
- **Dorado** — Negro #1C1C2E + Dorado #C9A84C (predeterminada — la más representativa del producto)
- **Carbono** — Negro #1C1C2E + Rojo #E63946
- (4ª paleta existe en el código)

---

## 9. IDENTIDAD DE MARCA — weboficial

### Nombre
**weboficial** — todo en minúsculas. Siempre así.

### Tipografía de marca
- **Display/Títulos:** Space Grotesk (bold)
- **Cuerpo en las plantillas:** Inter + tipografía de display según profesión

### Logotipo (Wordmark)
- La palabra "weboficial" escrita en Space Grotesk bold
- Las dos letras "i" de la palabra "oficial" están en **azul cielo (#0284c7)**
- El resto es navy (#0f1f3d) sobre fondo claro, o blanco sobre fondo oscuro

### Paleta de marca (del sitio, no de las plantillas)
| Token | Nombre | Hex |
|---|---|---|
| navy | Fondo oscuro / primario | #0f1f3d |
| sky | Acento azul cielo | #0284c7 |
| sky-dark | Acento azul oscuro | #0369a1 |
| surface | Blanco/fondo claro | #ffffff |
| surface-muted | Gris muy suave | #f8fafc |
| text-body | Texto cuerpo | #334155 |
| border-subtle | Bordes sutiles | #e2e8f0 |

### Tono de comunicación (inferido del copy del sitio)
- Directo y sin tecnicismos
- Cercano pero profesional
- Orientado a la acción ("elegís", "completás", "listo")
- Usa voseo argentino

---

## 10. SECCIONES DE LA HOME (lo que ve el visitante)

1. **Hero** — Titular + subtítulo + CTA principal + mockup visual de la página
2. **Cómo funciona** — 4 pasos: "Elegís tu profesión" / "Completás tus datos" / "Pagás con Mercado Pago" / "Tu página está online"
3. **Precio** — "$25.000 /mes. Incluye tu dominio, hosting y todas las ediciones que necesites. Pagás con Mercado Pago. Cancelá cuando quieras."
4. **CTA final** — "Empezá hoy mismo"
5. **Footer** — Wordmark + contacto (ver sección 12) + © weboficial

---

## 11. PANEL DE CONTROL (lo que ve el cliente después de pagar)

El usuario logueado ve:
- Tarjeta principal con su nombre, profesión, plantilla elegida y estado de la landing
- **Selector de paleta de colores** — cambia el color de su landing en tiempo real (4 opciones)
- Banner de estado de suscripción (activa / procesando / inactiva)
- Link directo a su página publicada
- Acceso a editar todos sus datos

### ⚠️ INCOMPLETO en el panel:
- Las estadísticas (visitas, etc.) aparecen en la UI con valor "0" y nota "próximamente" — no hay analytics conectado todavía.
- "Cambiar plantilla" aparece como link pero es un placeholder sin funcionalidad.

---

## 12. CONTACTO Y SOPORTE

### ⚠️ INCOMPLETO:
En el código del footer aparece el placeholder literal: `"[WhatsApp/contacto a definir]"`. No hay número de WhatsApp real publicado en el código. No hay email de soporte. No hay chat en vivo. No hay sistema de tickets.

**Implicación para marketing:** No incluyas un canal de contacto específico en campañas hasta que el equipo defina este dato.

---

## 13. LO QUE NO EXISTE (y no debe aparecer en campañas)

| Funcionalidad | Estado real |
|---|---|
| Psicólogos / otras profesiones | 🔲 SOLO PLANEADO |
| Período de prueba gratis | 🔲 No existe |
| Plan anual con descuento | 🔲 No existe |
| Múltiples planes | 🔲 No existe |
| Analytics / estadísticas de visitas | ⚠️ UI visible pero datos en 0, "próximamente" |
| Cambio de plantilla desde el panel | ⚠️ Botón visible pero sin funcionalidad |
| Dominio personalizado (.com.ar propio) | 🔲 No implementado — solo slug.weboficial.com.ar |
| WhatsApp de soporte | ⚠️ Placeholder en el código, sin dato real |
| Términos y condiciones | 🔲 No hay página de ToS en el código |
| Política de privacidad | 🔲 No hay página en el código |
| Soporte por email / chat | 🔲 No implementado |
| App móvil | 🔲 No existe — es web responsive |
| Blog / SEO content | 🔲 No existe |
| Pixel de Meta / Google Analytics | 🔲 No hay tracking en el código |

---

## 14. DIFERENCIADORES REALES (los que puedes usar en campañas)

1. **Hecho para profesionales argentinos, no para "cualquier negocio"** — El formulario conoce la matrícula de un contador, las áreas de práctica de un abogado. Es específico.
2. **Subdominio propio incluido** — `nombre.weboficial.com.ar` desde el primer día, sin pagar extra.
3. **Diseño de nivel que no parece template genérico** — Tipografías premium, paletas curadas, plantillas que se ven como si las hubiera hecho un diseñador.
4. **Pago con Mercado Pago** — El método que ya conoce el profesional argentino, con débito automático sin fricciones.
5. **Edición libre cuando quieran** — Cambio de teléfono, servicios, descripción, colores: sin depender de nadie, sin costo extra.
6. **Sin contratos** — Suscripción mensual, cancelable cuando quieran.

---

## 15. MENSAJES CLAVE PARA CAMPAÑAS

### Para contadores:
- "Tu matrícula merece una página a la altura."
- "Tus clientes te buscan online. ¿Estás ahí?"
- "La página que un contador necesita, sin contratar a nadie."
- "Completás tus datos, nosotros hacemos el resto."

### Para abogados:
- "La primera impresión de un abogado debería ser su página web."
- "Profesionalismo desde el primer clic."
- "Tu estudio jurídico, en línea en minutos."
- "Tus áreas de práctica, tu matrícula, tu imagen. Online hoy."

### Para ambas profesiones:
- "Sin programar. Sin diseñadores. Sin esperar."
- "$25.000 por mes. Menos que una hora de trabajo tuyo."
- "La única plataforma pensada para profesionales argentinos."

### Prompts de imagen sugeridos para publicidad:
- Profesional argentino (entre 35-50 años, traje o ropa formal discreta) mirando su celular con expresión de satisfacción, fondo de oficina limpia.
- Pantalla de notebook mostrando una página web profesional oscura (navy + verde o navy + dorado) con foto del profesional y nombre con matrícula.
- Mano sobre teclado, en segundo plano pantalla con diseño moderno profesional y el subdominio visible.
- Comparación antes/después: perfil de LinkedIn vs página propia con diseño elegante.

---

## APÉNDICE: DATOS TÉCNICOS QUE NO VAN EN CAMPAÑAS

*(Para referencia interna si necesitan validar algo)*

- Stack: Next.js + Supabase + Vercel
- Auth: Google OAuth únicamente
- Pagos: Mercado Pago preaprobación (suscripción recurrente)
- Subdominios: wildcard DNS `*.weboficial.com.ar`
- Fuentes en plantillas: Instrument Serif, Libre Baskerville, Inter, Space Grotesk
- Plantillas por profesión: 3 (Moderno, Clásico, Minimal)
- Paletas por plantilla: 4
- Secciones configurables: Hero, Sobre mí, Servicios, Contacto

---

*Documento generado por análisis técnico del código fuente. Última actualización basada en migraciones 0001–0015 y código de producción actual.*
