import { Playfair_Display, Inter } from "next/font/google";
import type { SectionConfigItem } from "@/lib/landings/update-landing";
import { buildWaLink } from "@/lib/whatsapp";
import { getInitials } from "@/lib/avatar-initials";
import { capitalizeName } from "@/lib/capitalize-name";
import { isValidMatricula } from "@/lib/is-valid-matricula";
import { FadeInSection } from "@/components/templates/shared/FadeInSection";
import { FloatingWhatsappButton } from "@/components/templates/shared/FloatingWhatsappButton";
import { SocialLinks } from "@/components/templates/shared/SocialLinks";

// Third profession, first of its three templates. Unlike abogado/contador
// there is no legacy checkbox-group field and no derive-fallback helper --
// this profession launched straight with the premium repeater-based field
// set (see migration 0023), so especialidades/obras_sociales/testimonios
// just render directly from formData with a plain hide-if-empty guard.
// "Cómo trabajo" is the only fixed generic copy here (same category as the
// abogado templates' Proceso/FAQ sections) -- everything else that could
// read as a fact about the specific professional comes from formData, and
// testimonios has no fallback/placeholder (never fabricate patient quotes).
//
// Ethical note (colegios de psicólogos' códigos deontológicos): advertising
// must be sober, state título + matrícula, and never promise guaranteed
// results -- no copy here (fixed or data-driven) implies an outcome.
const playfairDisplay = Playfair_Display({
  weight: ["400", "700"],
  style: ["normal", "italic"],
  subsets: ["latin"],
  variable: "--font-pw-display",
});
const inter = Inter({
  weight: ["400", "500", "600", "700", "800"],
  subsets: ["latin"],
  variable: "--font-pw-body",
});

// Definitive per-variant palette (see migration 0023): sage green for
// Moderno, on a warm white (not stark #FFFFFF) background -- blues, greens
// and muted earth tones test best for trust+calm in mental-health branding.
const DEFAULT_PRIMARY = "#6b7f6b";
const DEFAULT_ACCENT = "#6b7f6b";

export interface RepeaterItem {
  [key: string]: string;
}

export interface PsicologoFormData {
  name?: string;
  titulo_profesional?: string;
  matricula_numero?: string;
  profile_image?: string;
  phone?: string;
  email?: string;
  direccion?: string;
  horario_atencion?: string;
  modalidad?: string;
  enfoque_terapeutico?: string;
  descripcion?: string;
  precio_consulta?: string;
  cta_text?: string;
  linkedin_url?: string;
  instagram_url?: string;
  especialidades?: RepeaterItem[];
  poblacion_atendida?: string[];
  acepta_obras_sociales?: string;
  obras_sociales_detalle?: string;
  testimonios?: RepeaterItem[];
}

// enfoque_terapeutico moved from free text to a fixed `select` (migration
// 0031) -- form_data stores one of these keys, never the human label.
export const ENFOQUE_TERAPEUTICO_LABELS: Record<string, string> = {
  cognitivo_conductual: "Cognitivo-Conductual",
  psicoanalitica: "Psicoanalítica",
  sistemica: "Sistémica",
  gestalt: "Gestalt",
  integrativa: "Integrativa",
  otra: "Otra",
};

export const POBLACION_ATENDIDA_LABELS: Record<string, string> = {
  adultos: "Adultos",
  adolescentes: "Adolescentes",
  ninos: "Niños",
  parejas: "Parejas",
  familias: "Familias",
};

const MODALIDAD_LABELS: Record<string, string> = {
  presencial: "Atención presencial",
  online: "Atención online",
  ambas: "Atención presencial y online",
};

const COMO_TRABAJO = [
  {
    titulo: "Primer contacto",
    desc: "Me escribís por WhatsApp, me contás brevemente qué te trae a terapia y coordinamos un primer encuentro.",
  },
  {
    titulo: "Primera entrevista",
    desc: "Nos conocemos, conversamos sobre tu situación y evaluamos juntos cómo podemos trabajar.",
  },
  {
    titulo: "Proceso terapéutico",
    desc: "Avanzamos a tu ritmo, con sesiones regulares en un espacio de escucha y confidencialidad.",
  },
];

function Avatar({ name, photoUrl }: { name: string; photoUrl?: string }) {
  if (photoUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={photoUrl}
        alt={name}
        style={{ width: "100%", height: "100%", objectFit: "cover" }}
      />
    );
  }
  return <span className="pw-avatar-fallback">{getInitials(name)}</span>;
}

export function PsicologoModernoTemplate({
  formData,
  sectionsConfig,
  subdomain,
  colorPrimary = DEFAULT_PRIMARY,
  colorAccent = DEFAULT_ACCENT,
}: {
  formData: PsicologoFormData;
  sectionsConfig: SectionConfigItem[];
  subdomain?: string;
  colorPrimary?: string;
  colorAccent?: string;
}) {
  const visibleIds = new Set(
    sectionsConfig.filter((s) => s.visible).map((s) => s.id)
  );
  const showHero = visibleIds.has("hero");
  const showServices = visibleIds.has("services");
  const showAbout = visibleIds.has("about");
  const showContact = visibleIds.has("contact");

  const name = capitalizeName(formData.name || "");
  const matriculaNumero = isValidMatricula(formData.matricula_numero) ? formData.matricula_numero : undefined;
  const waLink = formData.phone ? buildWaLink(formData.phone) : null;
  const year = new Date().getFullYear();
  const ctaText = formData.cta_text || "Reservá tu turno";
  const especialidades = formData.especialidades ?? [];
  const poblacionAtendida = formData.poblacion_atendida ?? [];
  const obrasSocialesNombres =
    formData.acepta_obras_sociales === "si" && formData.obras_sociales_detalle
      ? formData.obras_sociales_detalle.split(",").map((s) => s.trim()).filter(Boolean)
      : [];
  const testimonios = formData.testimonios ?? [];
  const modalidadLabel = formData.modalidad
    ? MODALIDAD_LABELS[formData.modalidad] || formData.modalidad
    : "";
  const enfoqueLabel = formData.enfoque_terapeutico
    ? ENFOQUE_TERAPEUTICO_LABELS[formData.enfoque_terapeutico] ?? formData.enfoque_terapeutico
    : "";
  const showModalidadBand =
    Boolean(modalidadLabel) || obrasSocialesNombres.length > 0 || poblacionAtendida.length > 0;
  const heroLead = enfoqueLabel
    ? `Enfoque terapéutico: ${enfoqueLabel}`
    : "Un espacio de escucha y acompañamiento profesional.";

  return (
    <div
      className={`${playfairDisplay.variable} ${inter.variable} pw-moderno`}
      style={
        {
          "--c-primary": colorPrimary,
          "--c-accent": colorAccent,
          "--c-primary-dark": "#4a5a4a",
          "--c-accent-lt": "#E9EEE7",
          "--c-bg": "#FDFCF9",
          "--c-bg2": "#F3F1E9",
          "--c-text": "#2B2F2B",
          "--c-muted": "#666F63",
          "--c-border": "#E4E1D3",
        } as React.CSSProperties
      }
    >
      <style>{CSS}</style>

      <header className="pw-nav">
        <div className="pw-container pw-nav-inner">
          <a className="pw-nav-logo" href="#top">
            <strong>{name || "Tu nombre"}</strong>
            {formData.titulo_profesional && <span>{formData.titulo_profesional}</span>}
          </a>
          <nav className="pw-nav-links" aria-label="Navegación principal">
            {showServices && especialidades.length > 0 && <a href="#especialidades">Especialidades</a>}
            {showAbout && <a href="#sobre-mi">Sobre mí</a>}
            {showContact && <a href="#contacto">Contacto</a>}
          </nav>
          {waLink && (
            <div className="pw-nav-cta">
              <a className="pw-btn pw-btn-primary" href={waLink} target="_blank" rel="noopener">
                {ctaText}
              </a>
            </div>
          )}
        </div>
      </header>

      {showHero && (
        <section className="pw-hero" id="top">
          <div className="pw-container pw-hero-grid">
            <div className="pw-hero-photo">
              <Avatar name={name} photoUrl={formData.profile_image} />
            </div>
            <div className="pw-hero-copy">
              <span className="pw-eyebrow">
                {formData.titulo_profesional}
                {formData.titulo_profesional && matriculaNumero ? " · " : ""}
                {matriculaNumero ? `Mat. Nº ${matriculaNumero}` : ""}
              </span>
              <h1>{name || "Tu nombre"}</h1>
              <p className="pw-lead">{heroLead}</p>
              <div className="pw-hero-actions">
                {waLink && (
                  <a className="pw-btn pw-btn-primary" href={waLink} target="_blank" rel="noopener">
                    {ctaText}
                  </a>
                )}
                {showServices && especialidades.length > 0 && (
                  <a className="pw-btn pw-btn-outline" href="#especialidades">
                    Ver especialidades
                  </a>
                )}
              </div>
            </div>
          </div>
        </section>
      )}

      {showServices && especialidades.length > 0 && (
        <section className="pw-section" id="especialidades">
          <div className="pw-container">
            <FadeInSection className="pw-section-head">
              <span className="pw-eyebrow">Especialidades</span>
              <h2>En qué puedo ayudarte</h2>
            </FadeInSection>
            <div className="pw-especialidades-grid">
              {especialidades.map((item, i) => (
                <FadeInSection
                  key={`${item.titulo}-${i}`}
                  as="article"
                  delayMs={Math.min(i, 5) * 70}
                  className="pw-especialidad-card"
                >
                  <span className="pw-especialidad-icon-badge">{item.icono || "🧠"}</span>
                  <h3>{item.titulo}</h3>
                  {item.descripcion && <p>{item.descripcion}</p>}
                </FadeInSection>
              ))}
            </div>
          </div>
        </section>
      )}

      {showModalidadBand && (
        <section className="pw-section pw-modalidad" id="modalidad">
          <div className="pw-container">
            <FadeInSection className="pw-section-head pw-section-head-center">
              <span className="pw-eyebrow pw-eyebrow-center">Información práctica</span>
              <h2>Modalidad y cobertura</h2>
            </FadeInSection>
            <div className="pw-modalidad-body">
              {modalidadLabel && (
                <FadeInSection className="pw-modalidad-chip">
                  <span className="pw-modalidad-icon">📍</span>
                  <span>{modalidadLabel}</span>
                </FadeInSection>
              )}
              {poblacionAtendida.length > 0 && (
                <FadeInSection delayMs={40} className="pw-obras-sociales">
                  <p className="pw-obras-sociales-label">Atiendo a</p>
                  <div className="pw-obras-sociales-pills">
                    {poblacionAtendida.map((value) => (
                      <span key={value} className="pw-pill">
                        {POBLACION_ATENDIDA_LABELS[value] ?? value}
                      </span>
                    ))}
                  </div>
                </FadeInSection>
              )}
              {obrasSocialesNombres.length > 0 && (
                <FadeInSection delayMs={70} className="pw-obras-sociales">
                  <p className="pw-obras-sociales-label">Obras sociales y prepagas</p>
                  <div className="pw-obras-sociales-pills">
                    {obrasSocialesNombres.map((nombre, i) => (
                      <span key={`${nombre}-${i}`} className="pw-pill">
                        {nombre}
                      </span>
                    ))}
                  </div>
                </FadeInSection>
              )}
            </div>
          </div>
        </section>
      )}

      <section className="pw-process" id="como-trabajo">
        <div className="pw-container">
          <FadeInSection className="pw-section-head">
            <span className="pw-eyebrow">Metodología</span>
            <h2>Cómo trabajo</h2>
          </FadeInSection>
          <div className="pw-process-grid">
            {COMO_TRABAJO.map((step, i) => (
              <FadeInSection key={step.titulo} delayMs={i * 70} className="pw-process-step">
                <span className="pw-num">{String(i + 1).padStart(2, "0")}</span>
                <h3>{step.titulo}</h3>
                <p>{step.desc}</p>
              </FadeInSection>
            ))}
          </div>
        </div>
      </section>

      {showAbout && (
        <section className="pw-section" id="sobre-mi">
          <div className="pw-container pw-about-grid">
            <FadeInSection className="pw-about-bio">
              <h2>Sobre {name || "Tu nombre"}</h2>
              {formData.descripcion && <p>{formData.descripcion}</p>}
              {enfoqueLabel && (
                <p className="pw-enfoque">Enfoque terapéutico: {enfoqueLabel}</p>
              )}
            </FadeInSection>
            <FadeInSection delayMs={80} className="pw-credentials-box">
              {formData.titulo_profesional && (
                <div className="pw-credential-line">
                  <span className="pw-glyph">🎓</span>
                  <span>{formData.titulo_profesional}</span>
                </div>
              )}
              {matriculaNumero && (
                <div className="pw-credential-line">
                  <span className="pw-glyph">🪪</span>
                  <span>Matrícula Nº {matriculaNumero}</span>
                </div>
              )}
              {formData.horario_atencion && (
                <div className="pw-credential-line">
                  <span className="pw-glyph">🕒</span>
                  <span>{formData.horario_atencion}</span>
                </div>
              )}
            </FadeInSection>
          </div>
        </section>
      )}

      {testimonios.length > 0 && (
        <section className="pw-section pw-testimonials" id="testimonios">
          <div className="pw-container">
            <FadeInSection className="pw-section-head pw-section-head-center">
              <span className="pw-eyebrow pw-eyebrow-center">Testimonios</span>
              <h2>Lo que dicen mis pacientes</h2>
            </FadeInSection>
            <div className="pw-testimonials-grid">
              {testimonios.map((t, i) => (
                <FadeInSection
                  key={`${t.nombre}-${i}`}
                  as="article"
                  delayMs={Math.min(i, 5) * 70}
                  className="pw-testimonial-card"
                >
                  <p className="pw-testimonial-quote">&ldquo;{t.texto}&rdquo;</p>
                  <div className="pw-testimonial-author">
                    <span className="pw-testimonial-name">{t.nombre}</span>
                    {t.cargo && <span className="pw-testimonial-role">{t.cargo}</span>}
                  </div>
                </FadeInSection>
              ))}
            </div>
          </div>
        </section>
      )}

      {showContact && (
        <section className="pw-cta-banner" id="contacto">
          <div className="pw-container">
            <h2>¿Querés empezar un proceso terapéutico?</h2>
            <p>Escribime y coordinamos una consulta.</p>
            {formData.horario_atencion && <p className="pw-cta-schedule">{formData.horario_atencion}</p>}
            {formData.precio_consulta && (
              <p className="pw-cta-schedule">Valor de la consulta: {formData.precio_consulta}</p>
            )}
            {waLink && (
              <a className="pw-btn pw-btn-dark" href={waLink} target="_blank" rel="noopener">
                Escribime por WhatsApp
              </a>
            )}
          </div>
        </section>
      )}

      <footer className="pw-footer">
        <div className="pw-container">
          <div className="pw-footer-grid">
            <div className="pw-footer-brand">
              <strong>{name || "Tu nombre"}</strong>
              {formData.titulo_profesional && <p>{formData.titulo_profesional}</p>}
              {matriculaNumero && <p>Matrícula Nº {matriculaNumero}</p>}
              {subdomain && <p className="pw-footer-domain">{`${subdomain}.weboficial.com.ar`}</p>}
            </div>
            <div className="pw-footer-contact">
              {formData.email && <p>{formData.email}</p>}
              {formData.phone && <p>{formData.phone}</p>}
              {formData.direccion && <p>Zona / consultorio: {formData.direccion}</p>}
              {formData.horario_atencion && <p>{formData.horario_atencion}</p>}
              <SocialLinks
                linkedinUrl={formData.linkedin_url}
                instagramUrl={formData.instagram_url}
                className="pw-footer-social"
              />
            </div>
          </div>
          <p className="pw-footer-disclaimer">
            La información de este sitio tiene fines informativos y no reemplaza una consulta profesional. Ante una
            emergencia, comunicate con los servicios de emergencia de tu localidad.
          </p>
          <p className="pw-footer-bottom">{`© ${year} ${name || "Tu nombre"}. Todos los derechos reservados.`}</p>
        </div>
      </footer>

      <FloatingWhatsappButton
        phone={formData.phone}
        accentColor="var(--c-primary-dark)"
        iconColor="#FFFFFF"
        desktopVisible={false}
      />
    </div>
  );
}

const CSS = `
.pw-moderno{
  font-family: var(--font-pw-body), -apple-system, BlinkMacSystemFont, sans-serif;
  color: var(--c-text);
  background: var(--c-bg);
  line-height: 1.6;
  overflow-x: hidden;
  scroll-behavior: smooth;
  -webkit-font-smoothing: antialiased;
}
.pw-moderno *, .pw-moderno *::before, .pw-moderno *::after{ box-sizing: border-box; }
.pw-moderno img{ max-width:100%; display:block; }
.pw-moderno a{ color:inherit; text-decoration:none; }
.pw-moderno h1, .pw-moderno h2, .pw-moderno h3{
  margin:0; font-family: var(--font-pw-display), serif; font-weight:700; letter-spacing:-.01em;
}
.pw-moderno p{ margin:0; overflow-wrap:anywhere; }
.pw-moderno section{ min-width:0; }
.pw-moderno svg{ flex-shrink:0; }
.pw-moderno .pw-container{ width:100%; max-width:1200px; margin-inline:auto; padding-inline:clamp(16px,4vw,32px); }

.pw-moderno .pw-eyebrow{
  display:inline-flex; align-items:center; gap:12px;
  font-size:.78rem; font-weight:600; letter-spacing:.08em; text-transform:uppercase;
  color:var(--c-primary-dark); overflow-wrap:anywhere;
}
.pw-moderno .pw-eyebrow::before{ content:""; width:28px; height:1px; background:var(--c-primary-dark); flex-shrink:0; }
.pw-moderno .pw-eyebrow-center::before{ display:none; }

.pw-moderno .pw-btn{
  display:inline-flex; align-items:center; justify-content:center; gap:10px;
  padding:14px 28px; border-radius:10px; font-weight:600; font-size:.92rem;
  border:1px solid transparent; cursor:pointer;
  transition:transform .15s ease, box-shadow .15s ease, background-color .15s ease, border-color .15s ease;
  white-space:nowrap;
}
.pw-moderno .pw-btn:active{ transform:scale(.98); }
.pw-moderno .pw-btn-primary{ background:var(--c-primary-dark); color:#fff; }
.pw-moderno .pw-btn-primary:hover{ transform:translateY(-2px); box-shadow:0 12px 24px rgba(74,90,74,.24); }
.pw-moderno .pw-btn-outline{ background:transparent; border-color:var(--c-border); color:var(--c-text); }
.pw-moderno .pw-btn-outline:hover{ border-color:var(--c-primary-dark); transform:translateY(-2px); }
.pw-moderno .pw-btn-dark{ background:var(--c-primary-dark); color:#fff; }
.pw-moderno .pw-btn-dark:hover{ transform:translateY(-2px); box-shadow:0 12px 24px rgba(74,90,74,.24); }

.pw-moderno .pw-avatar-fallback{
  display:flex; align-items:center; justify-content:center; width:100%; height:100%;
  border-radius:50%; background:linear-gradient(135deg,var(--c-primary-dark),var(--c-primary));
  color:#fff; font-family: var(--font-pw-display), serif; font-weight:700;
}

.pw-moderno .pw-nav{
  position:sticky; top:0; z-index:50;
  background:rgba(253,252,249,.88); backdrop-filter:blur(10px); -webkit-backdrop-filter:blur(10px);
  border-bottom:1px solid var(--c-border);
}
.pw-moderno .pw-nav-inner{ display:flex; align-items:center; justify-content:space-between; gap:16px; padding-block:16px; }
.pw-moderno .pw-nav-logo{ display:flex; flex-direction:column; min-width:0; line-height:1.25; }
.pw-moderno .pw-nav-logo strong{
  font-family: var(--font-pw-display), serif; font-weight:700; font-size:1.05rem; color:var(--c-primary-dark);
  overflow:hidden; text-overflow:ellipsis; white-space:nowrap;
}
.pw-moderno .pw-nav-logo span{ font-size:.74rem; color:var(--c-muted); overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
.pw-moderno .pw-nav-links{ display:flex; align-items:center; gap:32px; font-size:.9rem; font-weight:500; color:var(--c-muted); }
.pw-moderno .pw-nav-links a:hover{ color:var(--c-primary-dark); }
.pw-moderno .pw-nav-cta .pw-btn{ padding:11px 20px; font-size:.85rem; }
@media (max-width:860px){ .pw-moderno .pw-nav-links{ display:none; } }

.pw-moderno .pw-hero{
  position:relative;
  padding-block:64px 84px;
  background:
    radial-gradient(1100px 460px at 88% -12%, rgba(107,127,107,.14), transparent 60%),
    linear-gradient(180deg, var(--c-bg2) 0%, var(--c-bg) 62%);
  overflow:hidden;
}
.pw-moderno .pw-hero-grid{ display:grid; grid-template-columns:320px 1fr; gap:64px; align-items:center; }
.pw-moderno .pw-hero-photo{
  width:320px; height:320px; border-radius:50%; overflow:hidden;
  box-shadow:0 24px 48px rgba(74,90,74,.2), 0 0 0 8px rgba(107,127,107,.14);
  border:4px solid #fff; background:var(--c-bg2);
}
.pw-moderno .pw-hero-photo .pw-avatar-fallback{ font-size:5rem; }
.pw-moderno .pw-hero-copy h1{ font-size:clamp(2.1rem,4vw,3.2rem); line-height:1.14; margin-block:16px 14px; color:var(--c-primary-dark); overflow-wrap:anywhere; }
.pw-moderno .pw-lead{ color:var(--c-muted); font-size:1.1rem; max-width:52ch; margin-bottom:32px; }
.pw-moderno .pw-hero-actions{ display:flex; flex-wrap:wrap; gap:14px; }
@media (max-width:760px){
  .pw-moderno .pw-hero{ padding-block:44px 52px; }
  .pw-moderno .pw-hero-grid{ grid-template-columns:1fr; gap:32px; text-align:center; justify-items:center; }
  .pw-moderno .pw-hero-photo{ width:200px; height:200px; }
  .pw-moderno .pw-hero-photo .pw-avatar-fallback{ font-size:3rem; }
  .pw-moderno .pw-lead{ margin-inline:auto; }
  .pw-moderno .pw-hero-actions{ justify-content:center; }
}

.pw-moderno .pw-section{ padding-block:88px; }
.pw-moderno .pw-section-head{ max-width:640px; margin-bottom:48px; }
.pw-moderno .pw-section-head-center{ margin-inline:auto; text-align:center; }
.pw-moderno .pw-section-head h2{ font-size:clamp(1.7rem,3.2vw,2.3rem); margin-top:14px; color:var(--c-primary-dark); }
@media (max-width:600px){ .pw-moderno .pw-section{ padding-block:60px; } }

.pw-moderno .pw-especialidades-grid{ display:grid; grid-template-columns:repeat(3,1fr); gap:24px; }
.pw-moderno .pw-especialidad-card{
  background:#fff; padding:36px 30px; min-width:0; border-radius:16px; border:1px solid var(--c-border);
  box-shadow:0 8px 24px rgba(74,90,74,.08);
  transition:transform .25s ease, box-shadow .25s ease;
}
.pw-moderno .pw-especialidad-card:hover{ transform:translateY(-6px); box-shadow:0 20px 40px rgba(74,90,74,.16); }
.pw-moderno .pw-especialidad-icon-badge{
  display:flex; align-items:center; justify-content:center; width:56px; height:56px; border-radius:50%;
  background:var(--c-accent-lt); font-size:1.7rem; margin-bottom:22px;
}
.pw-moderno .pw-especialidad-card h3{ font-size:1.15rem; color:var(--c-text); margin-bottom:10px; }
.pw-moderno .pw-especialidad-card p{ color:var(--c-muted); font-size:.92rem; }
@media (max-width:920px){ .pw-moderno .pw-especialidades-grid{ grid-template-columns:repeat(2,1fr); } }
@media (max-width:600px){ .pw-moderno .pw-especialidades-grid{ grid-template-columns:repeat(2,1fr); gap:16px; } }

.pw-moderno .pw-modalidad{ background:var(--c-bg2); }
.pw-moderno .pw-modalidad-body{ display:flex; flex-direction:column; align-items:center; gap:36px; }
.pw-moderno .pw-modalidad-chip{
  display:inline-flex; align-items:center; gap:12px; padding:16px 28px; border-radius:999px;
  background:#fff; border:1px solid var(--c-border); box-shadow:0 8px 24px rgba(74,90,74,.08);
  font-weight:600; color:var(--c-primary-dark); font-size:1rem;
}
.pw-moderno .pw-modalidad-icon{ font-size:1.3rem; }
.pw-moderno .pw-obras-sociales{ text-align:center; max-width:760px; }
.pw-moderno .pw-obras-sociales-label{ font-weight:600; color:var(--c-text); margin-bottom:18px; }
.pw-moderno .pw-obras-sociales-pills{ display:flex; flex-wrap:wrap; justify-content:center; gap:12px; }
.pw-moderno .pw-pill{
  display:inline-flex; align-items:center; padding:9px 18px; border-radius:999px;
  background:#fff; border:1px solid var(--c-border); font-size:.88rem; color:var(--c-text);
  box-shadow:0 4px 14px rgba(74,90,74,.06);
}

.pw-moderno .pw-process{ background:var(--c-primary-dark); color:#fff; padding-block:88px; }
.pw-moderno .pw-process .pw-section-head h2{ color:#fff; }
.pw-moderno .pw-process .pw-eyebrow{ color:#D7E0D3; }
.pw-moderno .pw-process .pw-eyebrow::before{ background:#D7E0D3; }
.pw-moderno .pw-process-grid{ display:grid; grid-template-columns:repeat(3,1fr); gap:32px; }
.pw-moderno .pw-process-step{ min-width:0; }
.pw-moderno .pw-num{ display:block; font-family: var(--font-pw-display), serif; font-size:2rem; font-weight:700; color:#D7E0D3; margin-bottom:14px; }
.pw-moderno .pw-process-step h3{ font-family: var(--font-pw-body), sans-serif; font-weight:700; font-size:1.02rem; margin-bottom:8px; }
.pw-moderno .pw-process-step p{ color:rgba(255,255,255,.72); font-size:.9rem; }
.pw-moderno .pw-process-step:not(:first-child){ border-top:1px solid rgba(255,255,255,.18); padding-top:24px; }
@media (min-width:761px){
  .pw-moderno .pw-process-step:not(:first-child){ border-top:none; padding-top:0; border-left:1px solid rgba(255,255,255,.18); padding-left:24px; }
}
@media (max-width:760px){ .pw-moderno .pw-process-grid{ grid-template-columns:repeat(2,1fr); gap:20px; } }

.pw-moderno .pw-about-grid{ display:grid; grid-template-columns:1.3fr 1fr; gap:56px; align-items:start; }
.pw-moderno .pw-about-bio h2{ font-size:clamp(1.6rem,3vw,2.1rem); color:var(--c-primary-dark); margin-bottom:22px; }
.pw-moderno .pw-about-bio p{ color:var(--c-text); font-size:1rem; line-height:1.75; margin-bottom:16px; max-width:62ch; }
.pw-moderno .pw-about-bio .pw-enfoque{ font-weight:600; color:var(--c-primary-dark); }
.pw-moderno .pw-credentials-box{
  background:var(--c-accent-lt); border-left:3px solid var(--c-primary-dark); border-radius:12px;
  padding:30px 28px; display:flex; flex-direction:column; gap:16px;
  box-shadow:0 8px 24px rgba(74,90,74,.08);
}
.pw-moderno .pw-credential-line{ display:flex; align-items:flex-start; gap:10px; font-size:.92rem; color:var(--c-text); overflow-wrap:anywhere; }
.pw-moderno .pw-glyph{ flex-shrink:0; }
@media (max-width:860px){ .pw-moderno .pw-about-grid{ grid-template-columns:1fr; } }

.pw-moderno .pw-testimonials-grid{ display:grid; grid-template-columns:repeat(3,1fr); gap:24px; }
.pw-moderno .pw-testimonial-card{
  background:#fff; border-radius:16px; border:1px solid var(--c-border); padding:32px 28px;
  box-shadow:0 8px 24px rgba(74,90,74,.08); display:flex; flex-direction:column; gap:20px;
  transition:transform .25s ease, box-shadow .25s ease;
}
.pw-moderno .pw-testimonial-card:hover{ transform:translateY(-4px); box-shadow:0 16px 32px rgba(74,90,74,.14); }
.pw-moderno .pw-testimonial-quote{ font-size:1rem; color:var(--c-text); line-height:1.7; font-style:italic; }
.pw-moderno .pw-testimonial-author{ display:flex; flex-direction:column; gap:2px; }
.pw-moderno .pw-testimonial-name{ font-weight:700; color:var(--c-primary-dark); font-size:.95rem; }
.pw-moderno .pw-testimonial-role{ font-size:.84rem; color:var(--c-muted); }
@media (max-width:920px){ .pw-moderno .pw-testimonials-grid{ grid-template-columns:1fr 1fr; } }
@media (max-width:600px){ .pw-moderno .pw-testimonials-grid{ grid-template-columns:repeat(2,1fr); gap:16px; } }

.pw-moderno .pw-cta-banner{ background:var(--c-primary); color:#fff; padding-block:68px; text-align:center; }
.pw-moderno .pw-cta-banner h2{ color:#fff; font-size:clamp(1.7rem,3.4vw,2.4rem); margin-bottom:14px; }
.pw-moderno .pw-cta-banner p{ color:rgba(255,255,255,.85); font-size:1rem; margin-bottom:12px; }
.pw-moderno .pw-cta-schedule{ font-size:.9rem; font-weight:600; margin-bottom:28px !important; }
.pw-moderno .pw-cta-banner .pw-btn{ margin-top:16px; }

.pw-moderno .pw-footer{ background:var(--c-primary-dark); color:rgba(255,255,255,.72); padding-block:48px 28px; }
.pw-moderno .pw-footer-grid{ display:grid; grid-template-columns:1fr 1fr; gap:24px; padding-bottom:28px; border-bottom:1px solid rgba(255,255,255,.16); margin-bottom:20px; }
.pw-moderno .pw-footer-brand strong{ display:block; font-family: var(--font-pw-display), serif; font-size:1.1rem; color:#fff; margin-bottom:4px; }
.pw-moderno .pw-footer-brand p{ font-size:.85rem; margin-bottom:4px; }
.pw-moderno .pw-footer-domain{ font-size:.78rem; color:rgba(255,255,255,.55); overflow-wrap:anywhere; }
.pw-moderno .pw-footer-contact{ font-size:.85rem; text-align:right; overflow-wrap:anywhere; }
.pw-moderno .pw-footer-contact p{ margin-bottom:4px; }
.pw-moderno .pw-footer-contact a:hover{ color:#fff; }
.pw-moderno .pw-footer-social{ display:flex; gap:12px; justify-content:flex-end; }
.pw-moderno .pw-footer-disclaimer{ font-size:.76rem; color:rgba(255,255,255,.5); max-width:70ch; line-height:1.6; margin-bottom:16px; }
.pw-moderno .pw-footer-bottom{ font-size:.78rem; color:rgba(255,255,255,.5); }
@media (max-width:600px){
  .pw-moderno .pw-footer-grid{ grid-template-columns:1fr; }
  .pw-moderno .pw-footer-contact{ text-align:left; }
  .pw-moderno .pw-footer-social{ justify-content:flex-start; }
}
`;
