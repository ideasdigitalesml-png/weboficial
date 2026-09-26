import type { PsicologoFormData } from "@/components/templates/psicologo/PsicologoModernoTemplate";

// Fictional sample data for generating catalog thumbnails (see
// scripts/generate-component-previews.js) -- same reasoning as
// generate-previews.js's ABOGADO_DATA/CONTADOR_DATA: these screenshots are
// shown before anyone has filled in the wizard, so unlike the live product
// it's fine for this to include invented testimonials.
export const PSICOLOGO_PREVIEW_DATA: PsicologoFormData = {
  name: "Valentina Ríos",
  titulo_profesional: "Psicóloga Clínica",
  matricula_numero: "34567",
  // No profile_image on purpose: an external stock-photo URL would be
  // blocked by next.config.ts's CSP img-src when this renders through a
  // real `next dev` response (unlike generate-previews.js's ABOGADO_DATA/
  // CONTADOR_DATA, which never hits the real server -- see
  // scripts/generate-previews.js's page.setContent() usage). The Avatar
  // component's initials fallback is a perfectly fine thumbnail anyway.
  phone: "+5491155512345",
  email: "valentina.rios@example.com",
  direccion: "Palermo, CABA",
  horario_atencion: "Lunes a viernes de 9 a 19hs",
  modalidad: "ambas",
  enfoque_terapeutico: "cognitivo_conductual",
  descripcion:
    "Acompaño procesos de ansiedad, duelo y autoestima con un enfoque cálido y basado en evidencia, para que encuentres herramientas concretas para tu día a día.",
  precio_consulta: "$15.000",
  cta_text: "Reservá tu turno",
  linkedin_url: "https://linkedin.com/in/valentina-rios",
  instagram_url: "https://instagram.com/valentina.psicologia",
  especialidades: [
    { icono: "🧠", titulo: "Ansiedad", descripcion: "Herramientas para manejar la ansiedad en el día a día." },
    { icono: "💔", titulo: "Duelo", descripcion: "Acompañamiento en procesos de pérdida y duelo." },
    { icono: "🌱", titulo: "Autoestima", descripcion: "Trabajo sobre autoconocimiento y autoestima." },
    { icono: "👥", titulo: "Vínculos", descripcion: "Terapia de pareja y dinámicas vinculares." },
    { icono: "😴", titulo: "Estrés", descripcion: "Manejo del estrés y prevención del burnout." },
    { icono: "🎯", titulo: "Desarrollo personal", descripcion: "Acompañamiento en procesos de cambio y crecimiento." },
  ],
  poblacion_atendida: ["adultos", "adolescentes", "parejas"],
  acepta_obras_sociales: "si",
  obras_sociales_detalle: "OSDE, Swiss Medical, Particular",
  testimonios: [
    {
      nombre: "M.L.",
      cargo: "Paciente",
      texto: "Encontré un espacio de escucha genuina, me ayudó muchísimo a ordenar mis pensamientos.",
    },
    {
      nombre: "J.P.",
      cargo: "Paciente",
      texto: "Profesional y muy cálida, me sentí acompañado en todo momento.",
    },
    {
      nombre: "R.G.",
      cargo: "Paciente",
      texto: "Recomiendo su trabajo, noté cambios reales en pocos meses.",
    },
  ],
};

// Matches each layout's DEFAULT_PRIMARY/DEFAULT_ACCENT in its own template
// file, which in turn matches the `templates.config` row seeded for
// psicologos (migration 0023) -- keeps the thumbnail's colors identical to
// what a real landing on that template actually looks like.
export const PSICOLOGO_PREVIEW_COLORS: Record<string, { primary: string; accent: string }> = {
  moderno: { primary: "#6b7f6b", accent: "#6b7f6b" },
  clasico: { primary: "#5b6b8c", accent: "#5b6b8c" },
  minimal: { primary: "#8b7d9e", accent: "#8b7d9e" },
};
