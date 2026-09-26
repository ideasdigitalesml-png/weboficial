import { Playfair_Display, Inter } from "next/font/google";
import type { SectionConfigItem } from "@/lib/landings/update-landing";
import {
  deriveContadorServiceEntries,
  DEFAULT_CONTADOR_WHY_US,
} from "@/lib/professions/contadores";
import { buildWaLink } from "@/lib/whatsapp";
import { getInitials } from "@/lib/avatar-initials";
import { capitalizeName } from "@/lib/capitalize-name";
import { isValidMatricula } from "@/lib/is-valid-matricula";
import { FadeInSection } from "@/components/templates/shared/FadeInSection";
import { FloatingWhatsappButton } from "@/components/templates/shared/FloatingWhatsappButton";
import { SocialLinks } from "@/components/templates/shared/SocialLinks";
import type { ContadorFormData } from "./ContadorLandingTemplate";

// Classic-professional layout: sticky nav, hero with copy on the left and
// photo on the right, service cards, a stats strip (años/clientes -- CSS
// reveal on scroll, no client JS ticker: every other template here is a
// plain server component and this one shouldn't be the first to need a
// "use client" boundary just for a cosmetic count-up), credentials table,
// "por qué elegirnos" and testimonios (only when populated), and a contact
// section. Same content rule as every other template in this directory:
// fields with no data are omitted entirely rather than filled with
// placeholder/fabricated copy.
const playfairDisplay = Playfair_Display({
  weight: ["500", "600", "700"],
  style: ["normal", "italic"],
  subsets: ["latin"],
  variable: "--font-cc-display",
});
const inter = Inter({
  weight: ["400", "500", "600", "700"],
  subsets: ["latin"],
  variable: "--font-cc-body",
});

// Definitive contador palette (azul petróleo + white + gray) -- not a
// picker. Primary and accent share the same hue on purpose, see the
// redesign brief: this profession leans on tone/contrast/whitespace rather
// than a second bright accent color.
const DEFAULT_PRIMARY = "#1B4F72";
const DEFAULT_ACCENT = "#1B4F72";

const MODALIDAD_LABELS: Record<string, string> = {
  presencial: "Atención presencial",
  remoto: "Atención remota",
  ambos: "Atención presencial y remota",
};

const ESPECIALIZACION_LABELS: Record<string, string> = {
  monotributo_autonomos: "Monotributo y Autónomos",
  pymes: "PYMES",
  sociedades: "Sociedades",
  ecommerce: "E-commerce",
  auditoria: "Auditoría",
  liquidacion_sueldos: "Liquidación de Sueldos",
};

function isRealUrl(value?: string): value is string {
  return Boolean(value && value !== "#");
}

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
  return <span className="cc-avatar-fallback">{getInitials(name)}</span>;
}

export function ContadorClasicoTemplate({
  formData,
  sectionsConfig,
  subdomain,
  colorPrimary = DEFAULT_PRIMARY,
  colorAccent = DEFAULT_ACCENT,
}: {
  formData: ContadorFormData;
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
  const matricula = isValidMatricula(formData.matricula) ? formData.matricula : undefined;
  const services = deriveContadorServiceEntries(formData);
  const waLink = formData.phone ? buildWaLink(formData.phone) : null;
  const year = new Date().getFullYear();
  const tituloProfesional = formData.titulo_profesional || "Contador Público";
  const hasStats = Boolean(formData.anos_experiencia || formData.cantidad_clientes);
  const hasRedes = isRealUrl(formData.linkedin_url) || isRealUrl(formData.instagram_url);
  const whyUs =
    formData.por_que_elegirnos && formData.por_que_elegirnos.length > 0
      ? formData.por_que_elegirnos
      : DEFAULT_CONTADOR_WHY_US;
  const testimonios = formData.testimonios ?? [];

  return (
    <div
      className={`${playfairDisplay.variable} ${inter.variable} cc-clasico`}
      style={
        {
          "--c-primary": colorPrimary,
          "--c-accent": colorAccent,
          "--c-bg": "#FFFFFF",
          "--c-bg2": "#F1F5F9",
          "--c-text": "#1C2B36",
          "--c-muted": "#64748B",
          "--c-border": "#E2E8F0",
        } as React.CSSProperties
      }
    >
      <style>{CSS}</style>

      <header className="cc-nav">
        <div className="cc-container cc-nav-inner">
          <a className="cc-nav-logo" href="#top">
            <strong>{name || "Tu nombre"}</strong>
            {formData.slogan && <span>{formData.slogan}</span>}
          </a>
          <nav className="cc-nav-links" aria-label="Navegación principal">
            {showServices && services.length > 0 && <a href="#servicios">Servicios</a>}
            {showAbout && <a href="#sobre-mi">Sobre mí</a>}
            {testimonios.length > 0 && <a href="#testimonios">Testimonios</a>}
            {showContact && <a href="#contacto">Contacto</a>}
          </nav>
          {waLink && (
            <a className="cc-btn cc-btn-primary" href={waLink} target="_blank" rel="noopener">
              Agendar consulta
            </a>
          )}
        </div>
      </header>

      {showHero && (
        <section className="cc-hero" id="top">
          <FadeInSection as="div" className="cc-container cc-hero-grid">
            <div className="cc-hero-copy">
              <span className="cc-eyebrow">
                {tituloProfesional}
                {formData.zona ? ` · ${formData.zona}` : ""}
              </span>
              <h1>{name || "Tu nombre"}</h1>
              <p className="cc-lead">
                {formData.slogan ||
                  formData.description ||
                  "Contabilidad prolija y a tiempo, con respuestas claras para cada decisión."}
              </p>
              <div className="cc-hero-actions">
                {waLink && (
                  <a className="cc-btn cc-btn-primary" href={waLink} target="_blank" rel="noopener">
                    Contactame
                  </a>
                )}
                {showServices && services.length > 0 && (
                  <a className="cc-btn cc-btn-outline" href="#servicios">
                    Ver servicios
                  </a>
                )}
              </div>
            </div>
            <div className="cc-hero-photo-wrap">
              <div className="cc-hero-photo">
                <Avatar name={name} photoUrl={formData.profile_image} />
              </div>
            </div>
          </FadeInSection>
        </section>
      )}

      {showServices && services.length > 0 && (
        <section className="cc-section" id="servicios">
          <div className="cc-container">
            <FadeInSection as="div" className="cc-section-head">
              <span className="cc-eyebrow">Servicios</span>
              <h2>En qué puedo ayudarte</h2>
            </FadeInSection>
            <div className="cc-services-grid">
              {services.map((s, i) => (
                <FadeInSection
                  key={i}
                  as="article"
                  delayMs={i * 60}
                  className="cc-service-card"
                >
                  {s.icono && <span className="cc-service-icon">{s.icono}</span>}
                  <h3>{s.titulo}</h3>
                  {s.descripcion && <p>{s.descripcion}</p>}
                </FadeInSection>
              ))}
            </div>
          </div>
        </section>
      )}

      {hasStats && (
        <section className="cc-stats">
          <div className="cc-container cc-stats-grid">
            {formData.anos_experiencia && (
              <div className="cc-stat">
                <span className="cc-stat-number">{formData.anos_experiencia}</span>
                <span className="cc-stat-label">Años de experiencia</span>
              </div>
            )}
            {formData.cantidad_clientes && (
              <div className="cc-stat">
                <span className="cc-stat-number">{formData.cantidad_clientes}</span>
                <span className="cc-stat-label">Clientes atendidos</span>
              </div>
            )}
          </div>
        </section>
      )}

      {showAbout && (
        <section className="cc-section" id="sobre-mi">
          <FadeInSection as="div" className="cc-container cc-about-grid">
            <div>
              <span className="cc-eyebrow">Trayectoria</span>
              <h2>Sobre {name || "Tu nombre"}</h2>
              {formData.description && <p className="cc-about-text">{formData.description}</p>}
            </div>
            <div className="cc-credentials-table">
              <div className="cc-row">
                <span className="cc-k">Título</span>
                <span className="cc-v">{tituloProfesional}</span>
              </div>
              {matricula && (
                <div className="cc-row">
                  <span className="cc-k">Matrícula</span>
                  <span className="cc-v">
                    N° {matricula}
                    {formData.jurisdiccion ? ` — ${formData.jurisdiccion}` : ""}
                  </span>
                </div>
              )}
              {formData.modalidad && (
                <div className="cc-row">
                  <span className="cc-k">Modalidad</span>
                  <span className="cc-v">
                    {MODALIDAD_LABELS[formData.modalidad] ?? formData.modalidad}
                  </span>
                </div>
              )}
              {formData.especializacion && formData.especializacion.length > 0 && (
                <div className="cc-row">
                  <span className="cc-k">Especialización</span>
                  <span className="cc-v">
                    {formData.especializacion
                      .map((v) => ESPECIALIZACION_LABELS[v] ?? v)
                      .join(", ")}
                  </span>
                </div>
              )}
              {formData.horario_atencion && (
                <div className="cc-row">
                  <span className="cc-k">Horario</span>
                  <span className="cc-v">{formData.horario_atencion}</span>
                </div>
              )}
              {formData.direccion && (
                <div className="cc-row">
                  <span className="cc-k">Dirección</span>
                  <span className="cc-v">{formData.direccion}</span>
                </div>
              )}
            </div>
          </FadeInSection>
        </section>
      )}

      <section className="cc-section cc-section-alt" id="por-que-elegirme">
        <div className="cc-container">
          <FadeInSection as="div" className="cc-section-head">
            <span className="cc-eyebrow">Por qué elegirme</span>
            <h2>Lo que me diferencia</h2>
          </FadeInSection>
          <div className="cc-why-grid">
            {whyUs.map((item, i) => (
              <FadeInSection
                key={i}
                as="div"
                delayMs={i * 60}
                className="cc-why-item"
              >
                <span className="cc-why-icon">{item.icono}</span>
                <p>{item.titulo}</p>
              </FadeInSection>
            ))}
          </div>
        </div>
      </section>

      {testimonios.length > 0 && (
        <section className="cc-section" id="testimonios">
          <div className="cc-container">
            <FadeInSection as="div" className="cc-section-head">
              <span className="cc-eyebrow">Testimonios</span>
              <h2>Lo que dicen mis clientes</h2>
            </FadeInSection>
            <div className="cc-testimonial-grid">
              {testimonios.map((t, i) => (
                <FadeInSection
                  key={i}
                  as="article"
                  delayMs={i * 60}
                  className="cc-testimonial-card"
                >
                  <p className="cc-testimonial-text">&ldquo;{t.texto}&rdquo;</p>
                  <p className="cc-testimonial-name">{t.nombre}</p>
                  {t.cargo && <p className="cc-testimonial-role">{t.cargo}</p>}
                </FadeInSection>
              ))}
            </div>
          </div>
        </section>
      )}

      {showContact && (
        <section className="cc-cta-banner" id="contacto">
          <FadeInSection as="div" className="cc-container">
            <h2>¿Listo para ordenar tus cuentas?</h2>
            <p>Escribime y coordinamos una primera consulta.</p>
            {waLink && (
              <a className="cc-btn cc-btn-ivory" href={waLink} target="_blank" rel="noopener">
                Contactame
              </a>
            )}
            <div className="cc-cta-contact">
              {formData.email && <a href={`mailto:${formData.email}`}>{formData.email}</a>}
              {(formData.zona || formData.jurisdiccion) && (
                <span>{[formData.zona, formData.jurisdiccion].filter(Boolean).join(" · ")}</span>
              )}
              {formData.direccion && <span>{formData.direccion}</span>}
              {formData.horario_atencion && <span>{formData.horario_atencion}</span>}
              {hasRedes && (
                <SocialLinks
                  linkedinUrl={formData.linkedin_url}
                  instagramUrl={formData.instagram_url}
                  className="cc-cta-redes"
                />
              )}
            </div>
          </FadeInSection>
        </section>
      )}

      <footer className="cc-footer">
        <div className="cc-container">
          <p className="cc-footer-name">{name || "Tu nombre"}</p>
          <p className="cc-footer-line">
            {tituloProfesional}
            {matricula ? ` · Matrícula N° ${matricula}` : ""}
          </p>
          {subdomain && <p className="cc-footer-line">{`${subdomain}.weboficial.com.ar`}</p>}
          <p className="cc-footer-bottom">{`© ${year} ${name || "Tu nombre"}. Todos los derechos reservados.`}</p>
        </div>
      </footer>

      <FloatingWhatsappButton
        phone={formData.phone}
        accentColor={colorAccent}
        desktopVisible={false}
      />
    </div>
  );
}

const CSS = `
.cc-clasico{
  font-family: var(--font-cc-body), -apple-system, BlinkMacSystemFont, sans-serif;
  color: var(--c-text);
  background: var(--c-bg);
  line-height: 1.65;
  overflow-x: hidden;
  scroll-behavior: smooth;
  -webkit-font-smoothing: antialiased;
}
.cc-clasico *, .cc-clasico *::before, .cc-clasico *::after{ box-sizing: border-box; }
.cc-clasico img{ max-width:100%; display:block; }
.cc-clasico a{ color:inherit; text-decoration:none; }
.cc-clasico h1, .cc-clasico h2, .cc-clasico h3{ margin:0; font-family: var(--font-cc-display), serif; font-weight:600; color:var(--c-primary); }
.cc-clasico p{ margin:0; overflow-wrap:anywhere; }
.cc-clasico section{ min-width:0; }
.cc-clasico svg{ flex-shrink:0; }
.cc-clasico .cc-container{ width:100%; max-width:1120px; margin-inline:auto; padding-inline:clamp(16px,4vw,32px); }

.cc-clasico .cc-eyebrow{ display:inline-block; font-size:.8rem; font-weight:600; letter-spacing:.06em; text-transform:uppercase; color:var(--c-accent); overflow-wrap:anywhere; }

.cc-clasico .cc-btn{
  display:inline-flex; align-items:center; justify-content:center; gap:10px;
  padding:14px 28px; border-radius:4px; font-weight:600; font-size:.92rem;
  border:1px solid var(--c-primary); cursor:pointer; white-space:nowrap;
  transition:background-color .15s ease, color .15s ease, transform .15s ease;
}
.cc-clasico .cc-btn:active{ transform:scale(.98); }
.cc-clasico .cc-btn-primary{ background:var(--c-primary); color:#fff; }
.cc-clasico .cc-btn-primary:hover{ background:var(--c-accent); border-color:var(--c-accent); }
.cc-clasico .cc-btn-outline{ background:transparent; color:var(--c-primary); }
.cc-clasico .cc-btn-outline:hover{ background:var(--c-bg2); }
.cc-clasico .cc-btn-ivory{ background:transparent; color:#fff; border-color:#fff; }
.cc-clasico .cc-btn-ivory:hover{ background:#fff; color:var(--c-primary); }

.cc-clasico .cc-avatar-fallback{
  display:flex; align-items:center; justify-content:center; width:100%; height:100%;
  background:linear-gradient(135deg,var(--c-primary),var(--c-accent)); color:#fff;
  font-family: var(--font-cc-display), serif; font-weight:600;
}

.cc-clasico .cc-nav{ position:sticky; top:0; z-index:50; background:rgba(255,255,255,.92); backdrop-filter:blur(10px); border-bottom:1px solid var(--c-border); }
.cc-clasico .cc-nav-inner{ display:flex; align-items:center; justify-content:space-between; gap:20px; padding-block:16px; }
.cc-clasico .cc-nav-logo{ display:flex; flex-direction:column; min-width:0; }
.cc-clasico .cc-nav-logo strong{ font-family: var(--font-cc-display), serif; font-weight:700; font-size:1.15rem; color:var(--c-primary); overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
.cc-clasico .cc-nav-logo span{ font-size:.76rem; color:var(--c-muted); margin-top:2px; }
.cc-clasico .cc-nav-links{ display:flex; align-items:center; gap:26px; font-size:.9rem; font-weight:600; color:var(--c-text); }
.cc-clasico .cc-nav-links a:hover{ color:var(--c-accent); }
@media (max-width:800px){ .cc-clasico .cc-nav-links{ display:none; } }

.cc-clasico .cc-hero{ padding-block:64px 80px; background:linear-gradient(180deg,color-mix(in srgb,var(--c-primary) 8%,white) 0%,var(--c-bg) 70%); }
.cc-clasico .cc-hero-grid{ display:grid; grid-template-columns:1.1fr .9fr; gap:56px; align-items:center; }
.cc-clasico .cc-hero-copy h1{ font-size:clamp(2.1rem,4.2vw,3.2rem); line-height:1.12; margin-block:16px 18px; }
.cc-clasico .cc-lead{ color:var(--c-muted); font-size:1.05rem; max-width:46ch; margin-bottom:30px; }
.cc-clasico .cc-hero-actions{ display:flex; flex-wrap:wrap; gap:14px; }
.cc-clasico .cc-hero-photo-wrap{ aspect-ratio:4/5; border-radius:6px; overflow:hidden; border:1px solid var(--c-border); box-shadow:0 20px 50px rgba(11,61,46,.14); }
.cc-clasico .cc-hero-photo{ width:100%; height:100%; background:var(--c-bg2); }
.cc-clasico .cc-hero-photo .cc-avatar-fallback{ font-size:4.5rem; }
@media (max-width:880px){
  .cc-clasico .cc-hero-grid{ grid-template-columns:1fr; gap:36px; }
  .cc-clasico .cc-hero-photo-wrap{ max-width:340px; margin-inline:auto; order:-1; }
}

.cc-clasico .cc-section{ padding-block:80px; }
.cc-clasico .cc-section-head{ max-width:620px; margin-bottom:44px; }
.cc-clasico .cc-section-head h2{ font-size:clamp(1.7rem,3.2vw,2.3rem); margin-top:12px; }
@media (max-width:600px){ .cc-clasico .cc-section{ padding-block:56px; } }

.cc-clasico .cc-services-grid{ display:grid; grid-template-columns:repeat(3,1fr); gap:22px; }
.cc-clasico .cc-service-card{
  background:var(--c-bg); border:1px solid var(--c-border); border-top:3px solid var(--c-accent);
  border-radius:8px; padding:28px 24px; min-width:0; box-shadow:0 8px 24px rgba(27,79,114,.06);
  transition:transform .18s ease, box-shadow .18s ease;
}
.cc-clasico .cc-service-card:hover{ transform:translateY(-4px); box-shadow:0 12px 32px rgba(27,79,114,.12); }
.cc-clasico .cc-service-icon{ font-size:1.7rem; display:block; margin-bottom:16px; }
.cc-clasico .cc-service-card h3{ font-size:1.05rem; margin-bottom:8px; }
.cc-clasico .cc-service-card p{ color:var(--c-muted); font-size:.92rem; }
@media (max-width:920px){ .cc-clasico .cc-services-grid{ grid-template-columns:1fr 1fr; } }
@media (max-width:600px){ .cc-clasico .cc-services-grid{ grid-template-columns:repeat(2,1fr); gap:16px; } }

.cc-clasico .cc-stats{ background:var(--c-primary); padding-block:56px; }
.cc-clasico .cc-stats-grid{ display:flex; justify-content:center; gap:80px; flex-wrap:wrap; text-align:center; }
.cc-clasico .cc-stat{ display:flex; flex-direction:column; gap:6px; animation: cc-stat-in .6s ease both; }
.cc-clasico .cc-stat-number{ font-family: var(--font-cc-display), serif; font-weight:700; font-size:clamp(2.4rem,5vw,3.4rem); color:#fff; }
.cc-clasico .cc-stat-label{ font-size:.86rem; color:rgba(255,255,255,.75); text-transform:uppercase; letter-spacing:.06em; }
@keyframes cc-stat-in{ from{ opacity:0; transform:translateY(14px); } to{ opacity:1; transform:translateY(0); } }

.cc-clasico .cc-about-grid{ display:grid; grid-template-columns:1.2fr .8fr; gap:56px; align-items:start; }
.cc-clasico .cc-about-text{ color:var(--c-text); font-size:1rem; margin-top:20px; max-width:58ch; }
.cc-clasico .cc-credentials-table{ border:1px solid var(--c-border); }
.cc-clasico .cc-row{ display:grid; grid-template-columns:120px 1fr; border-bottom:1px solid var(--c-border); }
.cc-clasico .cc-row:last-child{ border-bottom:none; }
.cc-clasico .cc-k{ padding:14px 16px; font-size:.76rem; font-weight:700; text-transform:uppercase; letter-spacing:.05em; color:var(--c-muted); background:var(--c-bg2); border-right:1px solid var(--c-border); }
.cc-clasico .cc-v{ padding:14px 16px; font-size:.92rem; }
@media (max-width:860px){ .cc-clasico .cc-about-grid{ grid-template-columns:1fr; } }

.cc-clasico .cc-section-alt{ background:var(--c-bg2); }
.cc-clasico .cc-why-grid{ display:grid; grid-template-columns:repeat(4,1fr); gap:20px; }
.cc-clasico .cc-why-item{
  display:flex; flex-direction:column; align-items:flex-start; gap:10px;
  padding:22px 20px; border-radius:8px; background:var(--c-bg); border:1px solid var(--c-border);
  box-shadow:0 8px 24px rgba(27,79,114,.06);
}
.cc-clasico .cc-why-icon{ font-size:1.7rem; }
.cc-clasico .cc-why-item p{ font-weight:600; font-size:.96rem; color:var(--c-text); }
@media (max-width:920px){ .cc-clasico .cc-why-grid{ grid-template-columns:repeat(2,1fr); } }
@media (max-width:560px){ .cc-clasico .cc-why-grid{ grid-template-columns:repeat(2,1fr); gap:16px; } }

.cc-clasico .cc-testimonial-grid{ display:grid; grid-template-columns:repeat(3,1fr); gap:22px; }
.cc-clasico .cc-testimonial-card{
  background:var(--c-bg); border:1px solid var(--c-border); border-radius:8px; padding:26px 24px; min-width:0;
  box-shadow:0 8px 24px rgba(27,79,114,.06);
}
.cc-clasico .cc-testimonial-text{ color:var(--c-text); font-size:.96rem; line-height:1.6; margin-bottom:16px; font-style:italic; }
.cc-clasico .cc-testimonial-name{ font-weight:700; font-size:.92rem; color:var(--c-primary); }
.cc-clasico .cc-testimonial-role{ font-size:.82rem; color:var(--c-muted); margin-top:2px; }
@media (max-width:920px){ .cc-clasico .cc-testimonial-grid{ grid-template-columns:repeat(2,1fr); } }
@media (max-width:600px){ .cc-clasico .cc-testimonial-grid{ grid-template-columns:repeat(2,1fr); gap:16px; } }

.cc-clasico .cc-cta-banner{ background:var(--c-primary); color:#fff; padding-block:64px; text-align:center; }
.cc-clasico .cc-cta-banner h2{ color:#fff; font-size:clamp(1.6rem,3.2vw,2.2rem); margin-bottom:12px; }
.cc-clasico .cc-cta-banner p{ color:rgba(255,255,255,.78); margin-bottom:26px; }
.cc-clasico .cc-cta-contact{ display:flex; flex-wrap:wrap; justify-content:center; gap:10px 24px; margin-top:28px; font-size:.9rem; color:rgba(255,255,255,.85); }
.cc-clasico .cc-cta-contact a:hover{ color:#fff; }
.cc-clasico .cc-cta-redes{ display:flex; gap:16px; }

.cc-clasico .cc-footer{ background:var(--c-bg2); border-top:1px solid var(--c-border); padding-block:36px; text-align:center; }
.cc-clasico .cc-footer-name{ font-family: var(--font-cc-display), serif; font-weight:700; font-size:1.1rem; color:var(--c-primary); }
.cc-clasico .cc-footer-line{ font-size:.86rem; color:var(--c-muted); margin-top:6px; overflow-wrap:anywhere; }
.cc-clasico .cc-footer-bottom{ margin-top:16px; font-size:.78rem; color:var(--c-muted); }
`;
