import { Playfair_Display, Inter } from "next/font/google";
import type { SectionConfigItem } from "@/lib/landings/update-landing";
import {
  deriveAbogadoServiceEntries,
  DEFAULT_ABOGADO_WHY_US,
} from "@/lib/professions/abogados";
import { buildWaLink } from "@/lib/whatsapp";
import { getInitials } from "@/lib/avatar-initials";
import { capitalizeName } from "@/lib/capitalize-name";
import { isValidMatricula } from "@/lib/is-valid-matricula";
import { FadeInSection } from "@/components/templates/shared/FadeInSection";
import { FloatingWhatsappButton } from "@/components/templates/shared/FloatingWhatsappButton";

// Ported from templates/abogado.html into a server component with real
// data instead of {{mustache}} placeholders. Proceso and FAQ stay as fixed
// generic copy (informational, not data about a specific professional).
// Servicios, "Por qué elegirnos" and Testimonios all now render the
// professional's own data (see AbogadoFormData below + deriveAbogadoServiceEntries) --
// testimonios still has no fallback/placeholder and is hidden entirely when
// the professional hasn't added any (never fabricate quotes).
const playfairDisplay = Playfair_Display({
  weight: ["400", "700"],
  style: ["normal", "italic"],
  subsets: ["latin"],
  variable: "--font-aw-display",
});
const inter = Inter({
  weight: ["400", "500", "600", "700", "800"],
  subsets: ["latin"],
  variable: "--font-aw-body",
});

const DEFAULT_PRIMARY = "#1a2744";
const DEFAULT_ACCENT = "#c9a84c";

export interface RepeaterItem {
  [key: string]: string;
}

export interface AbogadoFormData {
  name?: string;
  matricula_numero?: string;
  matricula_colegio?: string;
  profile_image?: string;
  phone?: string;
  email?: string;
  direccion?: string;
  ciudad?: string;
  provincia?: string;
  linkedin_url?: string;
  servicios?: string[];
  descripcion_corta?: string;
  universidad?: string;
  año_graduacion?: string;
  asociacion_profesional?: string;
  // Added for the premium redesign -- see migration 0018 and
  // src/lib/professions/abogados.ts (deriveAbogadoServiceEntries) for the
  // fallback used when servicios_detallados is empty (existing landings
  // created before this field existed).
  slogan?: string;
  cta_text?: string;
  horario_atencion?: string;
  instagram_url?: string;
  anos_experiencia?: string;
  servicios_detallados?: RepeaterItem[];
  por_que_elegirnos?: RepeaterItem[];
  testimonios?: RepeaterItem[];
}

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
  return <span className="aw-avatar-fallback">{getInitials(name)}</span>;
}

const PROCESO = [
  { titulo: "Consulta inicial", desc: "Me contás tu situación y evaluamos juntos cómo puedo ayudarte." },
  { titulo: "Análisis del caso", desc: "Reviso la documentación y el contexto legal en detalle." },
  { titulo: "Estrategia legal", desc: "Definimos el camino más conveniente para tu caso." },
  { titulo: "Resolución y seguimiento", desc: "Avanzamos con la gestión y te mantengo al tanto en cada etapa." },
];

const FAQ = [
  { q: "¿Cuánto cuesta una consulta inicial?", a: "La primera consulta es sin costo. Escribime por WhatsApp para coordinar un horario." },
  { q: "¿Cuánto tiempo puede llevar mi caso?", a: "Depende del tipo de trámite y su complejidad. Te doy un estimado realista en la primera consulta." },
  { q: "¿Trabajan con honorarios fijos o por porcentaje?", a: "Los honorarios se definen según el tipo y la complejidad del caso, siguiendo las pautas del colegio profesional correspondiente." },
  { q: "¿Qué documentos necesito para la primera consulta?", a: "En general: tu documento de identidad, la documentación relacionada al asunto y cualquier comunicación previa relevante." },
  { q: "¿Atienden solo en mi zona?", a: "Atiendo presencial en mi zona de trabajo y, para casos que lo permiten, también a distancia." },
];

export function AbogadoModernoTemplate({
  formData,
  sectionsConfig,
  subdomain,
  colorPrimary = DEFAULT_PRIMARY,
  colorAccent = DEFAULT_ACCENT,
  paletteVariables,
}: {
  formData: AbogadoFormData;
  sectionsConfig: SectionConfigItem[];
  subdomain?: string;
  colorPrimary?: string;
  colorAccent?: string;
  // Full CSS variable override from a curated paleta (see
  // src/lib/templates/abogado-paletas.ts). Same convention as
  // ContadorModernoTemplate.
  paletteVariables?: Record<string, string>;
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
  const services = deriveAbogadoServiceEntries(formData);
  const especialidadPrincipal = services[0]?.titulo ?? "";
  const waLink = formData.phone ? buildWaLink(formData.phone) : null;
  const year = new Date().getFullYear();
  const heroTagline = formData.slogan || formData.descripcion_corta || "";
  const ctaText = formData.cta_text || "Consultá ahora";
  const whyUs =
    formData.por_que_elegirnos && formData.por_que_elegirnos.length > 0
      ? formData.por_que_elegirnos
      : DEFAULT_ABOGADO_WHY_US;
  const testimonios = formData.testimonios ?? [];

  return (
    <div
      className={`${playfairDisplay.variable} ${inter.variable} aw-moderno`}
      style={
        (paletteVariables ?? {
          "--c-primary": colorPrimary,
          "--c-accent": colorAccent,
          "--c-accent-lt": "#F7EFDA",
          "--c-bg": "#FFFFFF",
          "--c-bg2": "#F7F8FA",
          "--c-text": "#0F0F1A",
          "--c-muted": "#64748B",
          "--c-border": "#E2E8F0",
        }) as React.CSSProperties
      }
    >
      <style>{CSS}</style>

      <header className="aw-nav">
        <div className="aw-container aw-nav-inner">
          <a className="aw-nav-logo" href="#top">
            <strong>{name || "Tu nombre"}</strong>
            {especialidadPrincipal && <span>{especialidadPrincipal}</span>}
          </a>
          <nav className="aw-nav-links" aria-label="Navegación principal">
            {showServices && services.length > 0 && <a href="#servicios">Servicios</a>}
            <a href="#proceso">Proceso</a>
            {showAbout && <a href="#sobre-mi">Sobre Mí</a>}
            {showContact && <a href="#contacto">Contacto</a>}
          </nav>
          {waLink && (
            <div className="aw-nav-cta">
              <a className="aw-btn aw-btn-primary" href={waLink} target="_blank" rel="noopener">
                Consulta gratuita
              </a>
            </div>
          )}
        </div>
      </header>

      {showHero && (
        <section className="aw-hero" id="top">
          <div className="aw-container aw-hero-grid">
            <div className="aw-hero-photo">
              <Avatar name={name} photoUrl={formData.profile_image} />
            </div>
            <div className="aw-hero-copy">
              <span className="aw-eyebrow">
                {especialidadPrincipal}
                {especialidadPrincipal && matriculaNumero ? " · " : ""}
                {matriculaNumero ? `Mat. Nº ${matriculaNumero}` : ""}
              </span>
              <h1>{name || "Tu nombre"}</h1>
              {heroTagline && <p className="aw-lead">{heroTagline}</p>}
              <div className="aw-hero-actions">
                {waLink && (
                  <a className="aw-btn aw-btn-primary" href={waLink} target="_blank" rel="noopener">
                    {ctaText}
                  </a>
                )}
                {showServices && services.length > 0 && (
                  <a className="aw-btn aw-btn-outline" href="#servicios">
                    Ver servicios
                  </a>
                )}
              </div>
            </div>
          </div>
        </section>
      )}

      {showServices && services.length > 0 && (
        <section className="aw-section" id="servicios">
          <div className="aw-container">
            <FadeInSection className="aw-section-head">
              <span className="aw-eyebrow">Servicios</span>
              <h2>Áreas de Práctica</h2>
            </FadeInSection>
            <div className="aw-services-grid">
              {services.map((s, i) => (
                <FadeInSection
                  key={`${s.titulo}-${i}`}
                  as="article"
                  delayMs={Math.min(i, 5) * 70}
                  className="aw-service-card"
                >
                  <span className="aw-service-icon-badge">{s.icono || "⚖️"}</span>
                  <h3>{s.titulo}</h3>
                  {s.descripcion && <p>{s.descripcion}</p>}
                </FadeInSection>
              ))}
            </div>
          </div>
        </section>
      )}

      <section className="aw-section aw-whyus" id="por-que-elegirnos">
        <div className="aw-container">
          <FadeInSection className="aw-section-head aw-section-head-center">
            <span className="aw-eyebrow aw-eyebrow-center">Por qué elegirnos</span>
            <h2>La diferencia está en el acompañamiento</h2>
          </FadeInSection>
          <div className="aw-whyus-grid">
            {whyUs.map((item, i) => (
              <FadeInSection
                key={`${item.titulo}-${i}`}
                delayMs={Math.min(i, 5) * 70}
                className="aw-whyus-item"
              >
                <span className="aw-whyus-icon">{item.icono || "✓"}</span>
                <p>{item.titulo}</p>
              </FadeInSection>
            ))}
          </div>
        </div>
      </section>

      <section className="aw-process" id="proceso">
        <div className="aw-container">
          <FadeInSection className="aw-section-head">
            <span className="aw-eyebrow">Metodología</span>
            <h2>Cómo trabajo</h2>
          </FadeInSection>
          <div className="aw-process-grid">
            {PROCESO.map((step, i) => (
              <FadeInSection key={step.titulo} delayMs={i * 70} className="aw-process-step">
                <span className="aw-num">{String(i + 1).padStart(2, "0")}</span>
                <h3>{step.titulo}</h3>
                <p>{step.desc}</p>
              </FadeInSection>
            ))}
          </div>
        </div>
      </section>

      {showAbout && (
        <section className="aw-section" id="sobre-mi">
          <div className="aw-container aw-about-grid">
            <FadeInSection className="aw-about-bio">
              <h2>Sobre {name || "Tu nombre"}</h2>
              {formData.descripcion_corta && <p>{formData.descripcion_corta}</p>}
            </FadeInSection>
            <FadeInSection delayMs={80} className="aw-credentials-box">
              {formData.anos_experiencia && (
                <div className="aw-credential-line">
                  <span className="aw-glyph">🕒</span>
                  <span>{formData.anos_experiencia} años de experiencia</span>
                </div>
              )}
              {(formData.universidad || formData.año_graduacion) && (
                <div className="aw-credential-line">
                  <span className="aw-glyph">🎓</span>
                  <span>
                    {formData.universidad}
                    {formData.universidad && formData.año_graduacion ? " — " : ""}
                    {formData.año_graduacion}
                  </span>
                </div>
              )}
              {matriculaNumero && (
                <div className="aw-credential-line">
                  <span className="aw-glyph">⚖️</span>
                  <span>
                    Matrícula Nº {matriculaNumero}
                    {formData.matricula_colegio ? ` — ${formData.matricula_colegio}` : ""}
                  </span>
                </div>
              )}
              {formData.asociacion_profesional && (
                <div className="aw-credential-line">
                  <span className="aw-glyph">🏛️</span>
                  <span>{formData.asociacion_profesional}</span>
                </div>
              )}
            </FadeInSection>
          </div>
        </section>
      )}

      {testimonios.length > 0 && (
        <section className="aw-section aw-testimonials" id="testimonios">
          <div className="aw-container">
            <FadeInSection className="aw-section-head aw-section-head-center">
              <span className="aw-eyebrow aw-eyebrow-center">Testimonios</span>
              <h2>Lo que dicen mis clientes</h2>
            </FadeInSection>
            <div className="aw-testimonials-grid">
              {testimonios.map((t, i) => (
                <FadeInSection
                  key={`${t.nombre}-${i}`}
                  as="article"
                  delayMs={Math.min(i, 5) * 70}
                  className="aw-testimonial-card"
                >
                  <p className="aw-testimonial-quote">&ldquo;{t.texto}&rdquo;</p>
                  <div className="aw-testimonial-author">
                    <span className="aw-testimonial-name">{t.nombre}</span>
                    {t.cargo && <span className="aw-testimonial-role">{t.cargo}</span>}
                  </div>
                </FadeInSection>
              ))}
            </div>
          </div>
        </section>
      )}

      <section className="aw-section" id="faq">
        <div className="aw-container">
          <FadeInSection className="aw-section-head aw-section-head-center">
            <span className="aw-eyebrow aw-eyebrow-center">Dudas frecuentes</span>
            <h2>Preguntas Frecuentes</h2>
          </FadeInSection>
          <div className="aw-faq-list">
            {FAQ.map((item) => (
              <details key={item.q} className="aw-faq-item">
                <summary>
                  {item.q}
                  <svg className="aw-faq-chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M6 9l6 6 6-6" />
                  </svg>
                </summary>
                <p className="aw-faq-answer">{item.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {showContact && (
        <section className="aw-cta-banner" id="contacto">
          <div className="aw-container">
            <h2>¿Tenés una consulta legal? Hablemos.</h2>
            <p>Primera consulta sin costo.</p>
            {formData.horario_atencion && (
              <p className="aw-cta-schedule">{formData.horario_atencion}</p>
            )}
            {waLink && (
              <a className="aw-btn aw-btn-dark" href={waLink} target="_blank" rel="noopener">
                Escribime por WhatsApp
              </a>
            )}
          </div>
        </section>
      )}

      <footer className="aw-footer">
        <div className="aw-container">
          <div className="aw-footer-grid">
            <div className="aw-footer-brand">
              <strong>{name || "Tu nombre"}</strong>
              {especialidadPrincipal && <p>{especialidadPrincipal}</p>}
              {matriculaNumero && (
                <p>
                  Mat. Nº {matriculaNumero}
                  {formData.matricula_colegio ? ` — ${formData.matricula_colegio}` : ""}
                </p>
              )}
              {subdomain && <p className="aw-footer-domain">{`${subdomain}.weboficial.com.ar`}</p>}
            </div>
            <div className="aw-footer-contact">
              {formData.email && <p>{formData.email}</p>}
              {formData.phone && <p>{formData.phone}</p>}
              {(formData.direccion || formData.ciudad || formData.provincia) && (
                <p>
                  {[formData.direccion, formData.ciudad, formData.provincia]
                    .filter(Boolean)
                    .join(", ")}
                </p>
              )}
              {formData.horario_atencion && <p>{formData.horario_atencion}</p>}
              {(isRealUrl(formData.linkedin_url) || isRealUrl(formData.instagram_url)) && (
                <p className="aw-footer-social">
                  {isRealUrl(formData.linkedin_url) && (
                    <a href={formData.linkedin_url} target="_blank" rel="noopener">
                      LinkedIn
                    </a>
                  )}
                  {isRealUrl(formData.instagram_url) && (
                    <a href={formData.instagram_url} target="_blank" rel="noopener">
                      Instagram
                    </a>
                  )}
                </p>
              )}
            </div>
          </div>
          <p className="aw-footer-disclaimer">
            La información en este sitio no constituye asesoramiento legal. Consultá con un profesional para tu caso específico.
          </p>
          <p className="aw-footer-bottom">{`© ${year} ${name || "Tu nombre"}. Todos los derechos reservados.`}</p>
        </div>
      </footer>

      <FloatingWhatsappButton
        phone={formData.phone}
        accentColor="var(--c-accent)"
        iconColor="var(--c-primary)"
        desktopVisible={false}
      />
    </div>
  );
}

const CSS = `
.aw-moderno{
  font-family: var(--font-aw-body), -apple-system, BlinkMacSystemFont, sans-serif;
  color: var(--c-text);
  background: var(--c-bg);
  line-height: 1.6;
  overflow-x: hidden;
  scroll-behavior: smooth;
  -webkit-font-smoothing: antialiased;
}
.aw-moderno *, .aw-moderno *::before, .aw-moderno *::after{ box-sizing: border-box; }
.aw-moderno img{ max-width:100%; display:block; }
.aw-moderno a{ color:inherit; text-decoration:none; }
.aw-moderno h1, .aw-moderno h2, .aw-moderno h3{
  margin:0; font-family: var(--font-aw-display), serif; font-weight:700; letter-spacing:-.01em;
}
.aw-moderno p{ margin:0; overflow-wrap:anywhere; }
.aw-moderno section{ min-width:0; }
.aw-moderno svg{ flex-shrink:0; }
.aw-moderno .aw-container{ width:100%; max-width:1200px; margin-inline:auto; padding-inline:clamp(16px,4vw,32px); }

.aw-moderno .aw-eyebrow{
  display:inline-flex; align-items:center; gap:12px;
  font-size:.78rem; font-weight:600; letter-spacing:.08em; text-transform:uppercase;
  color:var(--c-accent); overflow-wrap:anywhere;
}
.aw-moderno .aw-eyebrow::before{ content:""; width:28px; height:1px; background:var(--c-accent); flex-shrink:0; }
.aw-moderno .aw-eyebrow-center::before{ display:none; }

.aw-moderno .aw-btn{
  display:inline-flex; align-items:center; justify-content:center; gap:10px;
  padding:14px 28px; border-radius:8px; font-weight:600; font-size:.92rem;
  border:1px solid transparent; cursor:pointer;
  transition:transform .15s ease, box-shadow .15s ease, background-color .15s ease, border-color .15s ease;
  white-space:nowrap;
}
.aw-moderno .aw-btn:active{ transform:scale(.98); }
.aw-moderno .aw-btn-primary{ background:var(--c-accent); color:var(--c-primary); }
.aw-moderno .aw-btn-primary:hover{ transform:translateY(-2px); box-shadow:0 12px 24px rgba(26,39,68,.16); }
.aw-moderno .aw-btn-outline{ background:transparent; border-color:var(--c-border); color:var(--c-text); }
.aw-moderno .aw-btn-outline:hover{ border-color:var(--c-primary); transform:translateY(-2px); }
.aw-moderno .aw-btn-dark{ background:var(--c-primary); color:#fff; }
.aw-moderno .aw-btn-dark:hover{ transform:translateY(-2px); box-shadow:0 12px 24px rgba(26,39,68,.16); }

.aw-moderno .aw-avatar-fallback{
  display:flex; align-items:center; justify-content:center; width:100%; height:100%;
  border-radius:50%; background:linear-gradient(135deg,var(--c-primary),var(--c-accent));
  color:#fff; font-family: var(--font-aw-display), serif; font-weight:700;
}

.aw-moderno .aw-nav{
  position:sticky; top:0; z-index:50;
  background:rgba(255,255,255,.85); backdrop-filter:blur(10px); -webkit-backdrop-filter:blur(10px);
  border-bottom:1px solid var(--c-border);
}
.aw-moderno .aw-nav-inner{ display:flex; align-items:center; justify-content:space-between; gap:16px; padding-block:16px; }
.aw-moderno .aw-nav-logo{ display:flex; flex-direction:column; min-width:0; line-height:1.25; }
.aw-moderno .aw-nav-logo strong{
  font-family: var(--font-aw-display), serif; font-weight:700; font-size:1.05rem; color:var(--c-primary);
  overflow:hidden; text-overflow:ellipsis; white-space:nowrap;
}
.aw-moderno .aw-nav-logo span{ font-size:.74rem; color:var(--c-muted); overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
.aw-moderno .aw-nav-links{ display:flex; align-items:center; gap:32px; font-size:.9rem; font-weight:500; color:var(--c-muted); }
.aw-moderno .aw-nav-links a:hover{ color:var(--c-primary); }
.aw-moderno .aw-nav-cta .aw-btn{ padding:11px 20px; font-size:.85rem; }
@media (max-width:860px){ .aw-moderno .aw-nav-links{ display:none; } }

.aw-moderno .aw-hero{
  position:relative;
  padding-block:64px 84px;
  background:
    radial-gradient(1100px 460px at 88% -12%, rgba(201,168,76,.16), transparent 60%),
    linear-gradient(180deg, var(--c-bg2) 0%, var(--c-bg) 62%);
  overflow:hidden;
}
.aw-moderno .aw-hero-grid{ display:grid; grid-template-columns:320px 1fr; gap:64px; align-items:center; }
.aw-moderno .aw-hero-photo{
  width:320px; height:320px; border-radius:50%; overflow:hidden;
  box-shadow:0 24px 48px rgba(26,39,68,.18), 0 0 0 8px rgba(201,168,76,.14);
  border:4px solid #fff; background:var(--c-bg2);
}
.aw-moderno .aw-hero-photo .aw-avatar-fallback{ font-size:5rem; }
.aw-moderno .aw-hero-copy h1{ font-size:clamp(2.1rem,4vw,3.2rem); line-height:1.14; margin-block:16px 14px; color:var(--c-primary); overflow-wrap:anywhere; }
.aw-moderno .aw-lead{ color:var(--c-muted); font-size:1.1rem; max-width:52ch; margin-bottom:32px; }
.aw-moderno .aw-hero-actions{ display:flex; flex-wrap:wrap; gap:14px; }
@media (max-width:760px){
  .aw-moderno .aw-hero{ padding-block:44px 52px; }
  .aw-moderno .aw-hero-grid{ grid-template-columns:1fr; gap:32px; text-align:center; justify-items:center; }
  .aw-moderno .aw-hero-photo{ width:200px; height:200px; }
  .aw-moderno .aw-hero-photo .aw-avatar-fallback{ font-size:3rem; }
  .aw-moderno .aw-lead{ margin-inline:auto; }
  .aw-moderno .aw-hero-actions{ justify-content:center; }
}

.aw-moderno .aw-section{ padding-block:88px; }
.aw-moderno .aw-section-head{ max-width:640px; margin-bottom:48px; }
.aw-moderno .aw-section-head-center{ margin-inline:auto; text-align:center; }
.aw-moderno .aw-section-head h2{ font-size:clamp(1.7rem,3.2vw,2.3rem); margin-top:14px; color:var(--c-primary); }
@media (max-width:600px){ .aw-moderno .aw-section{ padding-block:60px; } }

.aw-moderno .aw-services-grid{ display:grid; grid-template-columns:repeat(3,1fr); gap:24px; }
.aw-moderno .aw-service-card{
  background:#fff; padding:36px 30px; min-width:0; border-radius:16px; border:1px solid var(--c-border);
  box-shadow:0 8px 24px rgba(26,39,68,.06);
  transition:transform .25s ease, box-shadow .25s ease;
}
.aw-moderno .aw-service-card:hover{ transform:translateY(-6px); box-shadow:0 20px 40px rgba(26,39,68,.14); }
.aw-moderno .aw-service-icon-badge{
  display:flex; align-items:center; justify-content:center; width:56px; height:56px; border-radius:50%;
  background:var(--c-accent-lt); font-size:1.7rem; margin-bottom:22px;
}
.aw-moderno .aw-service-card h3{ font-size:1.15rem; color:var(--c-text); margin-bottom:10px; }
.aw-moderno .aw-service-card p{ color:var(--c-muted); font-size:.92rem; }
@media (max-width:920px){ .aw-moderno .aw-services-grid{ grid-template-columns:repeat(2,1fr); } }
@media (max-width:600px){ .aw-moderno .aw-services-grid{ grid-template-columns:1fr; } }

.aw-moderno .aw-whyus-grid{ display:grid; grid-template-columns:repeat(4,1fr); gap:36px; }
.aw-moderno .aw-whyus-item{ display:flex; flex-direction:column; align-items:center; text-align:center; gap:16px; }
.aw-moderno .aw-whyus-icon{
  display:flex; align-items:center; justify-content:center; width:64px; height:64px; border-radius:50%;
  background:var(--c-accent-lt); font-size:2rem;
}
.aw-moderno .aw-whyus-item p{ font-weight:600; color:var(--c-primary); font-size:1rem; }
@media (max-width:860px){ .aw-moderno .aw-whyus-grid{ grid-template-columns:1fr 1fr; } }
@media (max-width:480px){ .aw-moderno .aw-whyus-grid{ grid-template-columns:1fr; } }

.aw-moderno .aw-process{ background:var(--c-primary); color:#fff; padding-block:88px; }
.aw-moderno .aw-process .aw-section-head h2{ color:#fff; }
.aw-moderno .aw-process .aw-eyebrow{ color:var(--c-accent); }
.aw-moderno .aw-process-grid{ display:grid; grid-template-columns:repeat(4,1fr); gap:32px; }
.aw-moderno .aw-process-step{ min-width:0; }
.aw-moderno .aw-num{ display:block; font-family: var(--font-aw-display), serif; font-size:2rem; font-weight:700; color:var(--c-accent); margin-bottom:14px; }
.aw-moderno .aw-process-step h3{ font-family: var(--font-aw-body), sans-serif; font-weight:700; font-size:1.02rem; margin-bottom:8px; }
.aw-moderno .aw-process-step p{ color:rgba(255,255,255,.62); font-size:.9rem; }
.aw-moderno .aw-process-step:not(:first-child){ border-top:1px solid rgba(255,255,255,.15); padding-top:24px; }
@media (min-width:761px){
  .aw-moderno .aw-process-step:not(:first-child){ border-top:none; padding-top:0; border-left:1px solid rgba(255,255,255,.15); padding-left:24px; }
}
@media (max-width:760px){ .aw-moderno .aw-process-grid{ grid-template-columns:1fr; gap:24px; } }

.aw-moderno .aw-about-grid{ display:grid; grid-template-columns:1.3fr 1fr; gap:56px; align-items:start; }
.aw-moderno .aw-about-bio h2{ font-size:clamp(1.6rem,3vw,2.1rem); color:var(--c-primary); margin-bottom:22px; }
.aw-moderno .aw-about-bio p{ color:var(--c-text); font-size:1rem; line-height:1.75; margin-bottom:16px; max-width:62ch; }
.aw-moderno .aw-credentials-box{
  background:var(--c-accent-lt); border-left:3px solid var(--c-accent); border-radius:12px;
  padding:30px 28px; display:flex; flex-direction:column; gap:16px;
  box-shadow:0 8px 24px rgba(26,39,68,.06);
}
.aw-moderno .aw-credential-line{ display:flex; align-items:flex-start; gap:10px; font-size:.92rem; color:var(--c-text); overflow-wrap:anywhere; }
.aw-moderno .aw-glyph{ flex-shrink:0; }
@media (max-width:860px){ .aw-moderno .aw-about-grid{ grid-template-columns:1fr; } }

.aw-moderno .aw-testimonials-grid{ display:grid; grid-template-columns:repeat(3,1fr); gap:24px; }
.aw-moderno .aw-testimonial-card{
  background:#fff; border-radius:16px; border:1px solid var(--c-border); padding:32px 28px;
  box-shadow:0 8px 24px rgba(26,39,68,.06); display:flex; flex-direction:column; gap:20px;
  transition:transform .25s ease, box-shadow .25s ease;
}
.aw-moderno .aw-testimonial-card:hover{ transform:translateY(-4px); box-shadow:0 16px 32px rgba(26,39,68,.12); }
.aw-moderno .aw-testimonial-quote{ font-size:1rem; color:var(--c-text); line-height:1.7; font-style:italic; }
.aw-moderno .aw-testimonial-author{ display:flex; flex-direction:column; gap:2px; }
.aw-moderno .aw-testimonial-name{ font-weight:700; color:var(--c-primary); font-size:.95rem; }
.aw-moderno .aw-testimonial-role{ font-size:.84rem; color:var(--c-muted); }
@media (max-width:920px){ .aw-moderno .aw-testimonials-grid{ grid-template-columns:1fr 1fr; } }
@media (max-width:600px){ .aw-moderno .aw-testimonials-grid{ grid-template-columns:1fr; } }

.aw-moderno .aw-faq-list{ max-width:800px; margin-inline:auto; }
.aw-moderno .aw-faq-item{ border-bottom:1px solid var(--c-border); }
.aw-moderno .aw-faq-item summary{
  list-style:none; display:flex; align-items:center; justify-content:space-between; gap:16px;
  padding-block:22px; font-weight:600; font-size:1rem; color:var(--c-primary); cursor:pointer;
}
.aw-moderno .aw-faq-item summary::-webkit-details-marker{ display:none; }
.aw-moderno .aw-faq-chevron{ flex-shrink:0; width:18px; height:18px; color:var(--c-accent); transition:transform .2s ease; }
.aw-moderno .aw-faq-item[open] .aw-faq-chevron{ transform:rotate(180deg); }
.aw-moderno .aw-faq-answer{ color:var(--c-muted); font-size:.95rem; line-height:1.7; padding-bottom:22px; max-width:66ch; }

.aw-moderno .aw-cta-banner{ background:var(--c-accent); color:var(--c-primary); padding-block:68px; text-align:center; }
.aw-moderno .aw-cta-banner h2{ color:var(--c-primary); font-size:clamp(1.7rem,3.4vw,2.4rem); margin-bottom:14px; }
.aw-moderno .aw-cta-banner p{ color:rgba(26,39,68,.75); font-size:1rem; margin-bottom:12px; }
.aw-moderno .aw-cta-schedule{ font-size:.9rem; font-weight:600; margin-bottom:28px !important; }
.aw-moderno .aw-cta-banner .aw-btn{ margin-top:16px; }

.aw-moderno .aw-footer{ background:var(--c-primary); color:rgba(255,255,255,.68); padding-block:48px 28px; }
.aw-moderno .aw-footer-grid{ display:grid; grid-template-columns:1fr 1fr; gap:24px; padding-bottom:28px; border-bottom:1px solid rgba(255,255,255,.14); margin-bottom:20px; }
.aw-moderno .aw-footer-brand strong{ display:block; font-family: var(--font-aw-display), serif; font-size:1.1rem; color:#fff; margin-bottom:4px; }
.aw-moderno .aw-footer-brand p{ font-size:.85rem; margin-bottom:4px; }
.aw-moderno .aw-footer-domain{ font-size:.78rem; color:rgba(255,255,255,.5); overflow-wrap:anywhere; }
.aw-moderno .aw-footer-contact{ font-size:.85rem; text-align:right; overflow-wrap:anywhere; }
.aw-moderno .aw-footer-contact p{ margin-bottom:4px; }
.aw-moderno .aw-footer-contact a:hover{ color:#fff; }
.aw-moderno .aw-footer-social{ display:flex; gap:12px; justify-content:flex-end; }
.aw-moderno .aw-footer-disclaimer{ font-size:.76rem; color:rgba(255,255,255,.45); max-width:70ch; line-height:1.6; margin-bottom:16px; }
.aw-moderno .aw-footer-bottom{ font-size:.78rem; color:rgba(255,255,255,.45); }
@media (max-width:600px){
  .aw-moderno .aw-footer-grid{ grid-template-columns:1fr; }
  .aw-moderno .aw-footer-contact{ text-align:left; }
  .aw-moderno .aw-footer-social{ justify-content:flex-start; }
}
`;
