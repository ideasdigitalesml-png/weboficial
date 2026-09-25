// Generates the static JPEG thumbnails used by the "Elegí una plantilla"
// step in onboarding. Loads each raw template HTML (the same files ported
// to React for the live wizard preview / public landing), fills in its
// {{placeholders}} with fictional sample data, renders it in a real browser
// at the template's design viewport, and screenshots the visible area.
//
// Re-run this whenever a template's HTML/CSS changes:
//   npm run generate:previews
//
// Only covers templates with a raw-HTML source under /templates/ (abogado's
// three + contador's moderno). Templates that only exist as React
// components -- contador's clasico/minimal, and all of psicologos -- use
// scripts/generate-component-previews.js instead, which screenshots a real
// `next dev` render instead of a filled-in HTML string, since those
// components use next/font and Tailwind (neither renders correctly through
// this script's page.setContent() approach).
const { chromium } = require("playwright");
const fs = require("node:fs");
const path = require("node:path");

const TEMPLATES_DIR = path.join(__dirname, "..", "templates");
const OUTPUT_DIR = path.join(__dirname, "..", "public", "previews");

const VIEWPORT = { width: 1440, height: 900 };
const JPEG_QUALITY = 80;

// Fictional sample data -- these screenshots are catalog thumbnails shown
// before anyone has filled in the wizard, not a real professional's page,
// so unlike the live product (wizard/public landing) it's fine for this
// data to include invented testimonials/stats: that's exactly what a
// template preview is supposed to show off.
const ABOGADO_DATA = {
  nombre_completo: "Marina Beltrán",
  especialidad_principal: "Derecho de Familia",
  tagline: "Acompañamiento legal cercano en cada etapa de tu caso.",
  descripcion_corta:
    "Más de una década asesorando a familias de La Plata en procesos de divorcio, sucesiones y régimen de visitas, con un trato humano y honorarios claros desde el primer día.",
  telefono_whatsapp: "5492215551234",
  foto_url: "https://i.pravatar.cc/600?img=47",
  matricula_numero: "78901",
  matricula_colegio: "Colegio de Abogados de La Plata",
  direccion: "Calle 7 N° 1234",
  ciudad: "La Plata",
  provincia: "Buenos Aires",
  email: "marina.beltran@example.com",
  linkedin_url: "https://linkedin.com/in/marina-beltran",
  año_actual: "2026",
  año_graduacion: "2010",
  años_experiencia: "14",
  areas_de_derecho: "6",
  casos_resueltos: "320",
  clientes_atendidos: "410",
  universidad: "Universidad Nacional de La Plata",
  posgrado_1: "Especialización en Derecho de Familia (UBA)",
  posgrado_2: "Diplomatura en Mediación (UNLP)",
  asociacion_profesional: "Colegio de Abogados de La Plata",
  bio_parrafo_1:
    "Soy abogada matriculada con más de 14 años de trayectoria en derecho de familia y sucesiones.",
  bio_parrafo_2:
    "Creo en un asesoramiento claro, sin tecnicismos innecesarios, para que cada cliente entienda con calma cada paso de su proceso.",
  primera_consulta_condicion: "sin costo",
  servicio_1_titulo: "Derecho de Familia",
  servicio_1_desc: "Divorcios, alimentos, tenencia y régimen de visitas.",
  servicio_2_titulo: "Sucesiones",
  servicio_2_desc: "Declaratorias de herederos, testamentos y partición de bienes.",
  servicio_3_titulo: "Derecho Civil",
  servicio_3_desc: "Contratos, daños y perjuicios, responsabilidad civil.",
  servicio_4_titulo: "Derecho Laboral",
  servicio_4_desc: "Despidos, liquidaciones y accidentes de trabajo.",
  servicio_5_titulo: "Derecho Penal",
  servicio_5_desc: "Defensa penal, excarcelaciones y exenciones.",
  servicio_6_titulo: "Derecho Societario",
  servicio_6_desc: "Constitución de sociedades y contratos comerciales.",
  proceso_1_titulo: "Consulta inicial",
  proceso_1_desc: "Me contás tu situación y evaluamos juntos cómo puedo ayudarte.",
  proceso_2_titulo: "Análisis del caso",
  proceso_2_desc: "Reviso la documentación y el contexto legal en detalle.",
  proceso_3_titulo: "Estrategia legal",
  proceso_3_desc: "Definimos el camino más conveniente para tu caso.",
  proceso_4_titulo: "Resolución y seguimiento",
  proceso_4_desc: "Avanzamos con la gestión y te mantengo al tanto en cada etapa.",
  testimonio_1_texto:
    "Marina me acompañó en un momento muy difícil y siempre explicó cada paso con mucha paciencia.",
  testimonio_1_nombre: "Rocío Fernández",
  testimonio_1_cargo: "Clienta",
  testimonio_2_texto: "Excelente profesional, resolvió la sucesión de mi familia en tiempo récord.",
  testimonio_2_nombre: "Julián Torres",
  testimonio_2_cargo: "Cliente",
  testimonio_3_texto: "Recomiendo su trabajo por la claridad y el trato cercano en todo momento.",
  testimonio_3_nombre: "Estela Gómez",
  testimonio_3_cargo: "Clienta",
  faq_1_pregunta: "¿Cuánto cuesta una consulta inicial?",
  faq_1_respuesta: "La primera consulta es sin costo. Escribime por WhatsApp para coordinar un horario.",
  faq_2_pregunta: "¿Atendés casos fuera de La Plata?",
  faq_2_respuesta: "Sí, trabajo con clientes de toda la provincia de Buenos Aires, de forma presencial o remota.",
  faq_3_pregunta: "¿Cuánto dura un proceso de divorcio?",
  faq_3_respuesta: "Depende de cada caso, pero un divorcio de común acuerdo suele resolverse en pocos meses.",
  faq_4_pregunta: "¿Cómo se calculan los honorarios?",
  faq_4_respuesta: "Los honorarios se definen según la complejidad del caso y se explican con claridad antes de empezar.",
  faq_5_pregunta: "¿Puedo hacer la consulta por videollamada?",
  faq_5_respuesta: "Sí, ofrezco consultas presenciales y también por videollamada.",
};

const CONTADOR_DATA = {
  nombre_completo: "Laura Sosa",
  titulo_profesional: "Contadora Pública",
  ciudad: "Rosario",
  bio: "Asesoro a pymes y monotributistas de Rosario con balances claros y acompañamiento impositivo todo el año.",
  whatsapp: "5493415551234",
  email: "laura.sosa@example.com",
  foto_url: "https://i.pravatar.cc/600?img=32",
  matricula: "445566",
  especialidades: "Monotributo, Balances, Asesoramiento impositivo",
  color_primary: "#0B2545",
  color_accent: "#1A6B4A",
  subdomain: "laurasosa",
  stat_clientes: "180",
  stat_anos: "10",
  stat_respuesta: "24hs",
  credencial_1: "Matriculada en CPCE Santa Fe",
  credencial_2: "Contadora Pública (UNR)",
  credencial_3: "+10 años de experiencia",
  credencial_4: "Especialista en Monotributo",
  servicio_1_icono: "📊",
  servicio_1_titulo: "Monotributo",
  servicio_1_desc: "Alta, recategorización y liquidación mensual.",
  servicio_2_icono: "🧾",
  servicio_2_titulo: "Balances",
  servicio_2_desc: "Balances y estados contables al día.",
  servicio_3_icono: "💼",
  servicio_3_titulo: "Asesoramiento impositivo",
  servicio_3_desc: "Planificación fiscal para tu actividad.",
  servicio_4_icono: "📈",
  servicio_4_titulo: "Liquidación de sueldos",
  servicio_4_desc: "Gestión de nómina y cargas sociales.",
  servicio_5_icono: "🏢",
  servicio_5_titulo: "Constitución de sociedades",
  servicio_5_desc: "Trámites societarios completos.",
  servicio_6_icono: "✅",
  servicio_6_titulo: "Auditoría",
  servicio_6_desc: "Revisión y control de estados contables.",
  testimonio_1_nombre: "Martín Díaz",
  testimonio_1_rubro: "Comercio",
  testimonio_1_texto: "Laura simplificó toda mi contabilidad, muy recomendable.",
  testimonio_2_nombre: "Sofía Ruiz",
  testimonio_2_rubro: "Diseñadora freelance",
  testimonio_2_texto: "Excelente atención y siempre responde rápido.",
  testimonio_3_nombre: "Pablo Ramos",
  testimonio_3_rubro: "Kiosco",
  testimonio_3_texto: "Me ayudó a ordenar el monotributo desde cero.",
};

const JOBS = [
  { file: "abogado.html", name: "abogado-moderno", data: ABOGADO_DATA },
  { file: "abogado-clasico.html", name: "abogado-clasico", data: ABOGADO_DATA },
  { file: "abogado-minimal.html", name: "abogado-minimal", data: ABOGADO_DATA },
  { file: "contador.html", name: "contador-moderno", data: CONTADOR_DATA },
];

function fillPlaceholders(html, data) {
  return html.replace(/\{\{([^}]+)\}\}/g, (match, key) => {
    const value = data[key.trim()];
    return value === undefined ? "" : value;
  });
}

async function main() {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });

  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: VIEWPORT });

  for (const job of JOBS) {
    const sourcePath = path.join(TEMPLATES_DIR, job.file);
    const rawHtml = fs.readFileSync(sourcePath, "utf8");
    const html = fillPlaceholders(rawHtml, job.data);

    // The filled HTML is also served directly (public/previews/<name>.html)
    // so the "Vista completa" link in the template picker opens a page with
    // the sample data already loaded, instead of the raw {{placeholder}}
    // source.
    const htmlOutputPath = path.join(OUTPUT_DIR, `${job.name}.html`);
    fs.writeFileSync(htmlOutputPath, html);

    await page.setContent(html, { waitUntil: "networkidle" });

    const jpgOutputPath = path.join(OUTPUT_DIR, `${job.name}.jpg`);
    await page.screenshot({ path: jpgOutputPath, type: "jpeg", quality: JPEG_QUALITY });
    console.log(`ok - ${job.file} -> public/previews/${job.name}.{jpg,html}`);
  }

  await browser.close();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
