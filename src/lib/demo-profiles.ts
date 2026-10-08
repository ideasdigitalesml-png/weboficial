import type { ContadorFormData } from "@/components/templates/contador/ContadorLandingTemplate";
import type { AbogadoFormData } from "@/components/templates/abogado/AbogadoModernoTemplate";
import type { PsicologoFormData } from "@/components/templates/psicologo/PsicologoModernoTemplate";

// Single source of truth for every fictional professional shown anywhere in
// this app: the home's "Así puede quedar tu página profesional" previews,
// the /previews/*.jpg generator scripts, the wizard's pre-fill-while-empty
// preview, and the public /ejemplo/* demo pages. Previously these were four
// separate, drifting data sets (see the conversation that introduced this
// file) -- e.g. "Laura Sosa" existed as both a contadora and an abogada.
//
// None of these people exist. Phone numbers and emails are deliberately
// non-functional: emails use example.com (the domain IANA reserves so it
// can never resolve), phone numbers are shaped like real AR mobile numbers
// but aren't registered to anyone. Photos are licensed stock (see
// /public/demo/CREDITS.md). linkedin_url/instagram_url are left unset
// rather than pointing at fabricated social accounts.
//
// Testimonios live ONLY here, for /ejemplo/* and the preview scripts --
// never copy them into a wizard's live-preview fallback. Every real
// template already renders testimonios as `formData.testimonios ?? []`
// (hidden until the professional adds their own), and that must stay true
// for every actual client page.

export const CONTADOR_DEMO_PROFILE: ContadorFormData = {
  name: "Cr. Diego Lertora",
  matricula: "118432",
  jurisdiccion: "Santa Fe",
  profile_image: "/demo/contador.webp",
  phone: "+5493415550123",
  email: "diego.lertora@example.com",
  zona: "Rosario, Santa Fe",
  modalidad: "ambos",
  servicios: ["monotributo", "ganancias", "balances", "asesoramiento_impositivo"],
  especializacion: ["pymes", "monotributo_autonomos"],
  description:
    "Contador matriculado con base en Rosario, especializado en pymes y monotributistas. Trabajo con respuestas claras y plazos cumplidos, para que nunca te agarre una fecha límite por sorpresa.",
  titulo_profesional: "Contador Público",
  anos_experiencia: "9",
  cantidad_clientes: "180",
  horario_atencion: "Lunes a viernes de 9 a 18 hs",
  slogan: "Contabilidad clara, al día y sin sorpresas.",
  direccion: "Córdoba 1450, Rosario",
  cta_text: "Quiero mi primera consulta",
  testimonios: [
    {
      nombre: "Soledad Ibarra",
      cargo: "Dueña de pyme textil",
      texto: "Desde que trabajo con Diego no me vuelvo a olvidar de un vencimiento. Explica todo en criollo.",
    },
    {
      nombre: "Ezequiel Monzón",
      cargo: "Monotributista",
      texto: "Me ayudó a recategorizarme y a entender qué estaba pagando de más. Muy recomendable.",
    },
  ],
};

export const ABOGADO_DEMO_PROFILE: AbogadoFormData = {
  name: "Dra. Camila Abalos",
  matricula_numero: "54219",
  matricula_colegio: "Colegio de Abogados de La Plata",
  profile_image: "/demo/abogado.webp",
  phone: "+5492215550167",
  email: "camila.abalos@example.com",
  direccion: "Calle 12 N° 1050, La Plata",
  ciudad: "La Plata",
  provincia: "Buenos Aires",
  zona: "La Plata y zona",
  modalidad: "ambas",
  servicios: ["familia", "sucesiones", "civil"],
  descripcion_corta:
    "Abogada especializada en derecho de familia y sucesiones en La Plata. Acompaño cada proceso con cercanía, explicando cada paso para que nunca te sientas perdido en los términos legales.",
  universidad: "Universidad Nacional de La Plata",
  año_graduacion: "2013",
  asociacion_profesional: "Colegio de Abogados de La Plata",
  slogan: "Defendemos tus derechos con cercanía y claridad.",
  horario_atencion: "Lunes a viernes de 10 a 19 hs",
  anos_experiencia: "11",
  testimonios: [
    {
      nombre: "Natalia Quiroga",
      cargo: "Clienta particular",
      texto: "Me acompañó en un divorcio complicado y siempre tuvo paciencia para explicarme cada paso.",
    },
    {
      nombre: "Hernán Boccardo",
      cargo: "Cliente particular",
      texto: "Resolvió la sucesión de mi familia en tiempo récord, con mucha claridad en cada trámite.",
    },
  ],
};

function isEmptyValue(value: unknown): boolean {
  if (value === undefined || value === null) return true;
  if (typeof value === "string") return value.length === 0;
  if (Array.isArray(value)) return value.length === 0;
  return false;
}

// Backfills whatever the professional hasn't typed yet, in the wizard's
// *live preview only*, with the matching demo profile field -- so the
// preview never looks half-empty while they're still filling the form.
// Only ever called on the preview object built fresh from `values` on every
// render (never on `values` itself), so nothing here can leak into
// saveDraftPage/createLandingAction: an empty field stays empty on the
// actual published page. Only backfills keys `preview` already declares,
// which is why passing a demo profile with `testimonios` is safe here --
// no wizard's preview object declares that key, so it's never copied in.
export function withDemoPlaceholder<T extends object>(preview: T, demo: T): T {
  const result = { ...preview };
  for (const key of Object.keys(preview) as (keyof T)[]) {
    if (isEmptyValue(result[key]) && demo[key] !== undefined) {
      result[key] = demo[key];
    }
  }
  return result;
}

export const PSICOLOGO_DEMO_PROFILE: PsicologoFormData = {
  name: "Lic. Julieta Marchetti",
  titulo_profesional: "Psicóloga Clínica",
  matricula_numero: "28917",
  profile_image: "/demo/psicologo.webp",
  phone: "+5491155550142",
  email: "julieta.marchetti@example.com",
  direccion: "Palermo, CABA",
  horario_atencion: "Lunes a viernes de 9 a 19 hs",
  modalidad: "ambas",
  enfoque_terapeutico: "cognitivo_conductual",
  descripcion:
    "Acompaño procesos de ansiedad, duelo y autoestima desde un enfoque cognitivo-conductual, con un espacio de escucha sin juicios para que puedas encontrar tus propias herramientas.",
  precio_consulta: "15000",
  especialidades: [
    { icono: "🧠", titulo: "Ansiedad", descripcion: "Herramientas concretas para manejar la ansiedad del día a día." },
    { icono: "💬", titulo: "Terapia de pareja", descripcion: "Espacio para trabajar la comunicación y los conflictos de pareja." },
    { icono: "🌱", titulo: "Autoestima", descripcion: "Proceso para fortalecer el vínculo con uno mismo." },
  ],
  poblacion_atendida: ["adultos", "adolescentes", "parejas"],
  acepta_obras_sociales: "si",
  obras_sociales_detalle: "OSDE, Swiss Medical y particular",
  testimonios: [
    {
      nombre: "M. L.",
      cargo: "Paciente",
      texto: "Encontré un espacio donde realmente me siento escuchada, sin apuro y sin juicios.",
    },
    {
      nombre: "J. P.",
      cargo: "Paciente",
      texto: "Me ayudó muchísimo a poner en palabras cosas que no sabía cómo nombrar.",
    },
  ],
};
