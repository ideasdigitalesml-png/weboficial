import { Libre_Baskerville, Inter } from "next/font/google";
import type { SectionConfigItem } from "@/lib/landings/update-landing";
import { serviceEntries } from "@/lib/professions/abogados";
import { buildWaLink } from "@/lib/whatsapp";
import { getInitials } from "@/lib/avatar-initials";

// Ported from templates/abogado.html into a server component with real
// data instead of {{mustache}} placeholders. Proceso and FAQ stay as fixed
// generic copy (informational, not data about a specific professional);
// trust bar (stats) and testimonios are omitted -- the wizard doesn't
// collect them and fabricating numbers/quotes would be dishonest. Same
// rule already applied to ContadorModernoTemplate.
const libreBaskerville = Libre_Baskerville({
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

const DEFAULT_PRIMARY = "#1C1C2E";
const DEFAULT_ACCENT = "#C9A84C";

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

const SERVICE_ICONS: Record<string, React.ReactNode> = {
  familia: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <circle cx="8" cy="6" r="2.2" />
      <path d="M3.5 18v-1.5a4 4 0 0 1 4-4h1a4 4 0 0 1 4 4V18" />
      <circle cx="16.5" cy="7" r="1.8" />
      <path d="M13.8 18v-1.2a3.2 3.2 0 0 1 3.2-3.2h.2a3.2 3.2 0 0 1 3.3 3.2V18" />
    </svg>
  ),
  documento: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M6 2.75h8l4 4V21a.75.75 0 0 1-.75.75H6A.75.75 0 0 1 5.25 21V3.5A.75.75 0 0 1 6 2.75Z" />
      <path d="M14 2.75V7h4" />
      <path d="M8.5 12h7M8.5 15.5h7M8.5 8.5h3" />
    </svg>
  ),
  balanza: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M12 3v18M8 21h8" />
      <path d="M4 7h16M4 7 2.5 11a2.5 2.5 0 0 0 5 0L6 7Zm14 0-1.5 4a2.5 2.5 0 0 0 5 0L20 7Z" />
    </svg>
  ),
  maletin: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <rect x="3" y="7.5" width="18" height="12" rx="1" />
      <path d="M8.5 7.5V6a2 2 0 0 1 2-2h3a2 2 0 0 1 2 2v1.5" />
      <path d="M3 12.5h18" />
    </svg>
  ),
  escudo: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M12 2.5 4.5 5.5V11c0 5.2 3.2 8.6 7.5 10.5 4.3-1.9 7.5-5.3 7.5-10.5V5.5Z" />
      <path d="M9 12l2 2 4-4" />
    </svg>
  ),
  edificio: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M4 21V6l8-3.5L20 6v15" />
      <path d="M4 21h16" />
      <path d="M9 21v-5h6v5" />
      <path d="M8.5 9h1.5M14 9h1.5M8.5 13h1.5M14 13h1.5" />
    </svg>
  ),
};

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

  const name = formData.name || "";
  const services = serviceEntries(formData.servicios ?? []);
  const especialidadPrincipal = services[0]?.label ?? "";
  const waLink = formData.phone ? buildWaLink(formData.phone) : null;
  const year = new Date().getFullYear();

  return (
    <div
      className={`${libreBaskerville.variable} ${inter.variable} aw-moderno`}
      style={
        (paletteVariables ?? {
          "--c-primary": colorPrimary,
          "--c-accent": colorAccent,
          "--c-accent-lt": "#FDF6E3",
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
                {especialidadPrincipal && formData.matricula_numero ? " · " : ""}
                {formData.matricula_numero ? `Mat. Nº ${formData.matricula_numero}` : ""}
              </span>
              <h1>{name || "Tu nombre"}</h1>
              {formData.descripcion_corta && (
                <p className="aw-lead">{formData.descripcion_corta}</p>
              )}
              <div className="aw-hero-actions">
                {waLink && (
                  <a className="aw-btn aw-btn-primary" href={waLink} target="_blank" rel="noopener">
                    Consultá ahora
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
            <div className="aw-section-head">
              <span className="aw-eyebrow">Servicios</span>
              <h2>Áreas de Práctica</h2>
            </div>
            <div className="aw-services-grid">
              {services.map((s) => (
                <article key={s.value} className="aw-service-card">
                  <span className="aw-service-icon">{SERVICE_ICONS[s.icon]}</span>
                  <h3>{s.label}</h3>
                  <p>{s.description}</p>
                </article>
              ))}
            </div>
          </div>
        </section>
      )}

      <section className="aw-process" id="proceso">
        <div className="aw-container">
          <div className="aw-section-head">
            <span className="aw-eyebrow">Metodología</span>
            <h2>Cómo trabajo</h2>
          </div>
          <div className="aw-process-grid">
            {PROCESO.map((step, i) => (
              <div key={step.titulo} className="aw-process-step">
                <span className="aw-num">{String(i + 1).padStart(2, "0")}</span>
                <h3>{step.titulo}</h3>
                <p>{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {showAbout && (
        <section className="aw-section" id="sobre-mi">
          <div className="aw-container aw-about-grid">
            <div className="aw-about-bio">
              <h2>Sobre {name || "Tu nombre"}</h2>
              {formData.descripcion_corta && <p>{formData.descripcion_corta}</p>}
            </div>
            <div className="aw-credentials-box">
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
              {formData.matricula_numero && (
                <div className="aw-credential-line">
                  <span className="aw-glyph">⚖️</span>
                  <span>
                    Matrícula Nº {formData.matricula_numero}
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
            </div>
          </div>
        </section>
      )}

      <section className="aw-section" id="faq">
        <div className="aw-container">
          <div className="aw-section-head aw-section-head-center">
            <span className="aw-eyebrow aw-eyebrow-center">Dudas frecuentes</span>
            <h2>Preguntas Frecuentes</h2>
          </div>
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
              {formData.matricula_numero && (
                <p>
                  Mat. Nº {formData.matricula_numero}
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
              {isRealUrl(formData.linkedin_url) && (
                <p>
                  <a href={formData.linkedin_url} target="_blank" rel="noopener">
                    LinkedIn
                  </a>
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

      {waLink && (
        <a className="aw-whatsapp-float" href={waLink} target="_blank" rel="noopener" aria-label="Contactar por WhatsApp">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
            <path d="M20 11.5a8 8 0 0 1-11.6 7.1L4 20l1.5-4.2A8 8 0 1 1 20 11.5Z" />
            <path d="M8.5 9.7c.3 2.6 2.2 4.5 4.8 4.8.6.1 1-.4.9-1l-.2-.9a.6.6 0 0 0-.5-.4l-1.2-.2a.6.6 0 0 1-.4-.3l-.6-1a.6.6 0 0 1 0-.6l.4-.9a.6.6 0 0 0-.1-.6l-.7-.9a.6.6 0 0 0-.7-.2c-.9.3-1.8 1-1.7 2.2Z" />
          </svg>
        </a>
      )}
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
  padding:14px 28px; border-radius:3px; font-weight:600; font-size:.92rem;
  border:1px solid transparent; cursor:pointer;
  transition:transform .15s ease, box-shadow .15s ease, background-color .15s ease, border-color .15s ease;
  white-space:nowrap;
}
.aw-moderno .aw-btn:active{ transform:scale(.98); }
.aw-moderno .aw-btn-primary{ background:var(--c-accent); color:var(--c-primary); }
.aw-moderno .aw-btn-primary:hover{ box-shadow:0 8px 20px rgba(28,28,46,.10); }
.aw-moderno .aw-btn-outline{ background:transparent; border-color:var(--c-border); color:var(--c-text); }
.aw-moderno .aw-btn-outline:hover{ border-color:var(--c-primary); }
.aw-moderno .aw-btn-dark{ background:var(--c-primary); color:#fff; }
.aw-moderno .aw-btn-dark:hover{ box-shadow:0 8px 20px rgba(28,28,46,.10); }

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

.aw-moderno .aw-hero{ padding-block:56px 72px; background:var(--c-bg); }
.aw-moderno .aw-hero-grid{ display:grid; grid-template-columns:280px 1fr; gap:64px; align-items:center; }
.aw-moderno .aw-hero-photo{
  width:280px; height:280px; border-radius:50%; overflow:hidden;
  box-shadow:0 8px 20px rgba(28,28,46,.10); border:1px solid var(--c-border); background:var(--c-bg2);
}
.aw-moderno .aw-hero-photo .aw-avatar-fallback{ font-size:4.5rem; }
.aw-moderno .aw-hero-copy h1{ font-size:clamp(2.1rem,4vw,3rem); line-height:1.14; margin-block:16px 14px; color:var(--c-primary); overflow-wrap:anywhere; }
.aw-moderno .aw-lead{ color:var(--c-muted); font-size:1.05rem; max-width:52ch; margin-bottom:30px; }
.aw-moderno .aw-hero-actions{ display:flex; flex-wrap:wrap; gap:14px; }
@media (max-width:760px){
  .aw-moderno .aw-hero{ padding-block:40px 48px; }
  .aw-moderno .aw-hero-grid{ grid-template-columns:1fr; gap:28px; text-align:center; justify-items:center; }
  .aw-moderno .aw-hero-photo{ width:180px; height:180px; }
  .aw-moderno .aw-hero-photo .aw-avatar-fallback{ font-size:2.8rem; }
  .aw-moderno .aw-lead{ margin-inline:auto; }
  .aw-moderno .aw-hero-actions{ justify-content:center; }
}

.aw-moderno .aw-section{ padding-block:80px; }
.aw-moderno .aw-section-head{ max-width:640px; margin-bottom:44px; }
.aw-moderno .aw-section-head-center{ margin-inline:auto; text-align:center; }
.aw-moderno .aw-section-head h2{ font-size:clamp(1.7rem,3.2vw,2.3rem); margin-top:14px; color:var(--c-primary); }
@media (max-width:600px){ .aw-moderno .aw-section{ padding-block:56px; } }

.aw-moderno .aw-services-grid{ display:grid; grid-template-columns:repeat(3,1fr); gap:1px; background:var(--c-border); border:1px solid var(--c-border); }
.aw-moderno .aw-service-card{ background:#fff; padding:32px 28px; min-width:0; transition:transform .18s ease, box-shadow .18s ease; }
.aw-moderno .aw-service-card:hover{ transform:translateY(-3px); box-shadow:0 1px 3px rgba(28,28,46,.08); position:relative; z-index:1; }
.aw-moderno .aw-service-icon{ display:block; width:44px; height:44px; color:var(--c-accent); margin-bottom:20px; }
.aw-moderno .aw-service-card h3{ font-size:1.15rem; color:var(--c-text); margin-bottom:10px; }
.aw-moderno .aw-service-card p{ color:var(--c-muted); font-size:.92rem; }
@media (max-width:920px){ .aw-moderno .aw-services-grid{ grid-template-columns:repeat(2,1fr); } }
@media (max-width:600px){ .aw-moderno .aw-services-grid{ grid-template-columns:1fr; } }

.aw-moderno .aw-process{ background:var(--c-primary); color:#fff; padding-block:80px; }
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
.aw-moderno .aw-credentials-box{ background:var(--c-accent-lt); border-left:3px solid var(--c-accent); padding:28px 26px; display:flex; flex-direction:column; gap:14px; }
.aw-moderno .aw-credential-line{ display:flex; align-items:flex-start; gap:10px; font-size:.92rem; color:var(--c-text); overflow-wrap:anywhere; }
.aw-moderno .aw-glyph{ flex-shrink:0; }
@media (max-width:860px){ .aw-moderno .aw-about-grid{ grid-template-columns:1fr; } }

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

.aw-moderno .aw-cta-banner{ background:var(--c-accent); color:var(--c-primary); padding-block:64px; text-align:center; }
.aw-moderno .aw-cta-banner h2{ color:var(--c-primary); font-size:clamp(1.7rem,3.4vw,2.4rem); margin-bottom:14px; }
.aw-moderno .aw-cta-banner p{ color:rgba(28,28,46,.75); font-size:1rem; margin-bottom:28px; }

.aw-moderno .aw-footer{ background:var(--c-primary); color:rgba(255,255,255,.68); padding-block:48px 28px; }
.aw-moderno .aw-footer-grid{ display:grid; grid-template-columns:1fr 1fr; gap:24px; padding-bottom:28px; border-bottom:1px solid rgba(255,255,255,.14); margin-bottom:20px; }
.aw-moderno .aw-footer-brand strong{ display:block; font-family: var(--font-aw-display), serif; font-size:1.1rem; color:#fff; margin-bottom:4px; }
.aw-moderno .aw-footer-brand p{ font-size:.85rem; margin-bottom:4px; }
.aw-moderno .aw-footer-domain{ font-size:.78rem; color:rgba(255,255,255,.5); overflow-wrap:anywhere; }
.aw-moderno .aw-footer-contact{ font-size:.85rem; text-align:right; overflow-wrap:anywhere; }
.aw-moderno .aw-footer-contact p{ margin-bottom:4px; }
.aw-moderno .aw-footer-contact a:hover{ color:#fff; }
.aw-moderno .aw-footer-disclaimer{ font-size:.76rem; color:rgba(255,255,255,.45); max-width:70ch; line-height:1.6; margin-bottom:16px; }
.aw-moderno .aw-footer-bottom{ font-size:.78rem; color:rgba(255,255,255,.45); }
@media (max-width:600px){
  .aw-moderno .aw-footer-grid{ grid-template-columns:1fr; }
  .aw-moderno .aw-footer-contact{ text-align:left; }
}

.aw-moderno .aw-whatsapp-float{
  position:fixed; right:20px; bottom:20px; z-index:60;
  width:56px; height:56px; border-radius:50%; background:var(--c-accent); color:var(--c-primary);
  display:flex; align-items:center; justify-content:center; box-shadow:0 8px 20px rgba(28,28,46,.10);
  transition:transform .18s ease;
}
.aw-moderno .aw-whatsapp-float svg{ width:26px; height:26px; }
.aw-moderno .aw-whatsapp-float:hover{ transform:scale(1.06); }
@media (max-width:480px){
  .aw-moderno .aw-whatsapp-float{ width:50px; height:50px; right:16px; bottom:16px; }
  .aw-moderno .aw-whatsapp-float svg{ width:22px; height:22px; }
}
`;
