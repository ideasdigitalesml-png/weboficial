import { Playfair_Display, Inter } from "next/font/google";
import type { SectionConfigItem } from "@/lib/landings/update-landing";
import {
  deriveAbogadoServiceEntries,
  DEFAULT_ABOGADO_WHY_US,
} from "@/lib/professions/abogados";
import { buildWaLink } from "@/lib/whatsapp";
import { getInitials } from "@/lib/avatar-initials";
import { FadeInSection } from "@/components/templates/shared/FadeInSection";
import { FloatingWhatsappButton } from "@/components/templates/shared/FloatingWhatsappButton";
import type { AbogadoFormData } from "./AbogadoModernoTemplate";

// Ported from templates/abogado-clasico.html. Same content rules as
// AbogadoModernoTemplate.tsx: proceso/FAQ are fixed generic copy. Servicios,
// "Por qué elegirnos" and Testimonios render the professional's own data --
// testimonios stays hidden entirely when there's none (never fabricate
// quotes).
const playfair = Playfair_Display({
  weight: ["400", "700"],
  style: ["normal", "italic"],
  subsets: ["latin"],
  variable: "--font-ac-display",
});
const inter = Inter({
  weight: ["400", "500", "600", "700"],
  subsets: ["latin"],
  variable: "--font-ac-body",
});

const DEFAULT_PRIMARY = "#1a2744";
const DEFAULT_ACCENT = "#c9a84c";

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
  return <span className="ac-avatar-fallback">{getInitials(name)}</span>;
}

export function AbogadoClasicoTemplate({
  formData,
  sectionsConfig,
  subdomain,
  colorPrimary = DEFAULT_PRIMARY,
  colorAccent = DEFAULT_ACCENT,
}: {
  formData: AbogadoFormData;
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

  const name = formData.name || "";
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
      className={`${playfair.variable} ${inter.variable} ac-clasico`}
      style={
        {
          "--c-primary": colorPrimary,
          "--c-accent": colorAccent,
          "--c-accent-lt": "#F7EFDA",
          "--c-bg": "#FFFFFF",
          "--c-bg2": "#F7F5EF",
          "--c-text": "#1B2130",
          "--c-muted": "#6B7280",
          "--c-border": "#E2DFD6",
        } as React.CSSProperties
      }
    >
      <style>{CSS}</style>

      <header className="ac-nav">
        <div className="ac-nav-rule" />
        <div className="ac-container ac-nav-inner">
          <a className="ac-nav-logo" href="#top">
            <strong>{name || "Tu nombre"}</strong>
            {especialidadPrincipal && <span className="ac-uc">{especialidadPrincipal}</span>}
          </a>
          <div className="ac-nav-row">
            {showServices && services.length > 0 && (
              <a className="ac-uc" href="#servicios">Servicios</a>
            )}
            <a className="ac-uc" href="#proceso">Proceso</a>
            {showAbout && <a className="ac-uc" href="#sobre-mi">Sobre Mí</a>}
            {showContact && <a className="ac-uc" href="#contacto">Contacto</a>}
            {waLink && (
              <a className="ac-btn ac-btn-outline" href={waLink} target="_blank" rel="noopener">
                Consulta gratuita
              </a>
            )}
          </div>
        </div>
        <div className="ac-nav-rule" />
      </header>

      {showHero && (
        <section className="ac-hero" id="top">
          <div className="ac-container">
            <div className="ac-hero-photo-wrap">
              <div className="ac-hero-photo">
                <Avatar name={name} photoUrl={formData.profile_image} />
              </div>
            </div>
            <div className="ac-hero-copy">
              <span className="ac-eyebrow ac-uc">
                {especialidadPrincipal}
                {especialidadPrincipal && formData.matricula_numero ? " · " : ""}
                {formData.matricula_numero ? `Mat. Nº ${formData.matricula_numero}` : ""}
              </span>
              <h1>{name || "Tu nombre"}</h1>
              {heroTagline && <p className="ac-lead">{heroTagline}</p>}
              <div className="ac-hero-actions">
                {waLink && (
                  <a className="ac-btn ac-btn-primary" href={waLink} target="_blank" rel="noopener">
                    {ctaText}
                  </a>
                )}
                {showServices && services.length > 0 && (
                  <a className="ac-btn ac-btn-outline" href="#servicios">
                    Ver servicios
                  </a>
                )}
              </div>
            </div>
          </div>
        </section>
      )}

      {showServices && services.length > 0 && (
        <section className="ac-section" id="servicios">
          <div className="ac-container">
            <FadeInSection className="ac-section-head">
              <span className="ac-eyebrow ac-uc">Servicios</span>
              <h2>Áreas de Práctica</h2>
            </FadeInSection>
            <div className="ac-services-list">
              {services.map((s, i) => (
                <FadeInSection
                  key={`${s.titulo}-${i}`}
                  delayMs={Math.min(i, 5) * 70}
                  className="ac-service-row"
                >
                  <span className="ac-service-medallion">{s.icono || "⚖️"}</span>
                  <div>
                    <h3>{s.titulo}</h3>
                    {s.descripcion && <p>{s.descripcion}</p>}
                  </div>
                </FadeInSection>
              ))}
            </div>
          </div>
        </section>
      )}

      <section className="ac-section ac-whyus" id="por-que-elegirnos">
        <div className="ac-container">
          <FadeInSection className="ac-section-head">
            <span className="ac-eyebrow ac-uc">Por qué elegirnos</span>
            <h2>La diferencia está en el acompañamiento</h2>
          </FadeInSection>
          <div className="ac-whyus-grid">
            {whyUs.map((item, i) => (
              <FadeInSection
                key={`${item.titulo}-${i}`}
                delayMs={Math.min(i, 5) * 70}
                className="ac-whyus-item"
              >
                <span className="ac-whyus-icon">{item.icono || "✓"}</span>
                <p>{item.titulo}</p>
              </FadeInSection>
            ))}
          </div>
        </div>
      </section>

      <section className="ac-section ac-process" id="proceso">
        <div className="ac-container">
          <FadeInSection className="ac-section-head">
            <span className="ac-eyebrow ac-uc">Metodología</span>
            <h2>Cómo trabajo</h2>
          </FadeInSection>
          <div className="ac-timeline">
            {PROCESO.map((step, i) => (
              <FadeInSection key={step.titulo} delayMs={i * 70} className="ac-timeline-step">
                <span className="ac-timeline-marker">{i + 1}</span>
                <h3>{step.titulo}</h3>
                <p>{step.desc}</p>
              </FadeInSection>
            ))}
          </div>
        </div>
      </section>

      {showAbout && (
        <section className="ac-section" id="sobre-mi">
          <div className="ac-container">
            <FadeInSection className="ac-section-head">
              <span className="ac-eyebrow ac-uc">Trayectoria</span>
              <h2>Sobre {name || "Tu nombre"}</h2>
            </FadeInSection>
            {formData.descripcion_corta && (
              <FadeInSection delayMs={60} className="ac-about-cols">
                <p className="ac-dropcap">{formData.descripcion_corta}</p>
              </FadeInSection>
            )}
            <FadeInSection delayMs={120} className="ac-credentials-table">
              {formData.anos_experiencia && (
                <div className="ac-row">
                  <span className="ac-k ac-uc">Experiencia</span>
                  <span className="ac-v">{formData.anos_experiencia} años</span>
                </div>
              )}
              {(formData.universidad || formData.año_graduacion) && (
                <div className="ac-row">
                  <span className="ac-k ac-uc">Formación</span>
                  <span className="ac-v">
                    {formData.universidad}
                    {formData.universidad && formData.año_graduacion ? " — " : ""}
                    {formData.año_graduacion}
                  </span>
                </div>
              )}
              {formData.matricula_numero && (
                <div className="ac-row">
                  <span className="ac-k ac-uc">Matrícula</span>
                  <span className="ac-v">
                    Nº {formData.matricula_numero}
                    {formData.matricula_colegio ? ` — ${formData.matricula_colegio}` : ""}
                  </span>
                </div>
              )}
              {formData.asociacion_profesional && (
                <div className="ac-row">
                  <span className="ac-k ac-uc">Asociación</span>
                  <span className="ac-v">{formData.asociacion_profesional}</span>
                </div>
              )}
            </FadeInSection>
          </div>
        </section>
      )}

      {testimonios.length > 0 && (
        <section className="ac-section ac-testimonials" id="testimonios">
          <div className="ac-container">
            <FadeInSection className="ac-section-head">
              <span className="ac-eyebrow ac-uc">Testimonios</span>
              <h2>Lo que dicen mis clientes</h2>
            </FadeInSection>
            <div className="ac-testimonials-grid">
              {testimonios.map((t, i) => (
                <FadeInSection
                  key={`${t.nombre}-${i}`}
                  as="article"
                  delayMs={Math.min(i, 5) * 70}
                  className="ac-testimonial-card"
                >
                  <span className="ac-testimonial-mark">&ldquo;</span>
                  <p className="ac-testimonial-quote">{t.texto}</p>
                  <div className="ac-testimonial-author">
                    <span className="ac-testimonial-name">{t.nombre}</span>
                    {t.cargo && <span className="ac-testimonial-role">{t.cargo}</span>}
                  </div>
                </FadeInSection>
              ))}
            </div>
          </div>
        </section>
      )}

      <section className="ac-section" id="faq">
        <div className="ac-container">
          <FadeInSection className="ac-section-head">
            <span className="ac-eyebrow ac-uc">Dudas frecuentes</span>
            <h2>Preguntas Frecuentes</h2>
          </FadeInSection>
          <div className="ac-faq-list">
            {FAQ.map((item) => (
              <div key={item.q} className="ac-faq-block">
                <p className="ac-faq-q">{item.q}</p>
                <p className="ac-faq-a">{item.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {showContact && (
        <section className="ac-cta-banner" id="contacto">
          <div className="ac-container">
            <h2>¿Tenés una consulta legal? Hablemos.</h2>
            <p>Primera consulta sin costo</p>
            {formData.horario_atencion && (
              <p className="ac-cta-schedule">{formData.horario_atencion}</p>
            )}
            {waLink && (
              <a className="ac-btn ac-btn-ivory" href={waLink} target="_blank" rel="noopener">
                Escribime por WhatsApp
              </a>
            )}
          </div>
        </section>
      )}

      <footer className="ac-footer">
        <div className="ac-container">
          <svg className="ac-footer-seal" viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth="1">
            <circle cx="24" cy="24" r="21" />
            <circle cx="24" cy="24" r="16" />
            <path d="M24 8v4M24 36v4M8 24h4M36 24h4M12.9 12.9l2.8 2.8M32.3 32.3l2.8 2.8M12.9 35.1l2.8-2.8M32.3 15.7l2.8-2.8" />
          </svg>
          <p className="ac-footer-name">{name || "Tu nombre"}</p>
          {(especialidadPrincipal || formData.matricula_numero) && (
            <p className="ac-footer-line">
              {especialidadPrincipal}
              {especialidadPrincipal ? <span className="ac-footer-sep">—</span> : null}
              {formData.matricula_numero ? `Mat. Nº ${formData.matricula_numero}` : ""}
              {formData.matricula_colegio ? ` — ${formData.matricula_colegio}` : ""}
            </p>
          )}
          <p className="ac-footer-line">
            {formData.email}
            {formData.email && formData.phone ? <span className="ac-footer-sep">—</span> : null}
            {formData.phone}
            {(formData.direccion || formData.ciudad || formData.provincia) && (
              <>
                <span className="ac-footer-sep">—</span>
                {[formData.direccion, formData.ciudad, formData.provincia].filter(Boolean).join(", ")}
              </>
            )}
          </p>
          {formData.horario_atencion && (
            <p className="ac-footer-line">{formData.horario_atencion}</p>
          )}
          {(isRealUrl(formData.linkedin_url) || isRealUrl(formData.instagram_url)) && (
            <p className="ac-footer-line">
              {isRealUrl(formData.linkedin_url) && (
                <a href={formData.linkedin_url} target="_blank" rel="noopener">
                  LinkedIn
                </a>
              )}
              {isRealUrl(formData.linkedin_url) && isRealUrl(formData.instagram_url) && (
                <span className="ac-footer-sep">—</span>
              )}
              {isRealUrl(formData.instagram_url) && (
                <a href={formData.instagram_url} target="_blank" rel="noopener">
                  Instagram
                </a>
              )}
            </p>
          )}
          {subdomain && (
            <p className="ac-footer-line">{`${subdomain}.weboficial.com.ar`}</p>
          )}
          <p className="ac-footer-disclaimer">
            La información en este sitio no constituye asesoramiento legal. Consultá con un profesional para tu caso específico.
          </p>
          <p className="ac-footer-bottom">{`© ${year} ${name || "Tu nombre"}. Todos los derechos reservados.`}</p>
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
.ac-clasico{
  font-family: var(--font-ac-body), Georgia, "Times New Roman", serif;
  color: var(--c-text);
  background: var(--c-bg);
  line-height: 1.7;
  overflow-x: hidden;
  scroll-behavior: smooth;
  -webkit-font-smoothing: antialiased;
}
.ac-clasico *, .ac-clasico *::before, .ac-clasico *::after{ box-sizing: border-box; }
.ac-clasico img{ max-width:100%; display:block; }
.ac-clasico a{ color:inherit; text-decoration:none; }
.ac-clasico h1, .ac-clasico h2, .ac-clasico h3{ margin:0; font-family: var(--font-ac-display), serif; font-weight:700; }
.ac-clasico p{ margin:0; overflow-wrap:anywhere; }
.ac-clasico section{ min-width:0; }
.ac-clasico svg{ flex-shrink:0; }
.ac-clasico .ac-container{ width:100%; max-width:1080px; margin-inline:auto; padding-inline:clamp(16px,4vw,32px); }
.ac-clasico .ac-uc{ text-transform:uppercase; letter-spacing:.08em; }

.ac-clasico .ac-eyebrow{ display:inline-block; font-size:.76rem; font-weight:600; color:var(--c-accent); overflow-wrap:anywhere; }

.ac-clasico .ac-btn{
  display:inline-flex; align-items:center; justify-content:center; gap:10px;
  padding:14px 30px; border-radius:2px; font-weight:600; font-size:.86rem;
  border:1px solid var(--c-primary); cursor:pointer;
  transition:background-color .15s ease, color .15s ease, transform .15s ease, box-shadow .15s ease;
  white-space:nowrap;
}
.ac-clasico .ac-btn:hover{ transform:translateY(-2px); }
.ac-clasico .ac-btn-primary{ background:var(--c-primary); color:#fff; }
.ac-clasico .ac-btn-primary:hover{ background:var(--c-accent); border-color:var(--c-accent); color:var(--c-primary); box-shadow:0 12px 24px rgba(26,39,68,.14); }
.ac-clasico .ac-btn-outline{ background:transparent; color:var(--c-primary); }
.ac-clasico .ac-btn-outline:hover{ background:var(--c-primary); color:#fff; }
.ac-clasico .ac-btn-ivory{ background:transparent; color:#FFFFFF; border:1px solid #FFFFFF; }
.ac-clasico .ac-btn-ivory:hover{ background:#FFFFFF; color:var(--c-primary); }

.ac-clasico .ac-avatar-fallback{
  display:flex; align-items:center; justify-content:center; width:100%; height:100%;
  border-radius:50%; background:linear-gradient(135deg,var(--c-primary),var(--c-accent));
  color:#fff; font-family: var(--font-ac-display), serif; font-weight:700;
}

.ac-clasico .ac-nav{ position:sticky; top:0; z-index:50; background:var(--c-bg); }
.ac-clasico .ac-nav-rule{ height:1px; background:var(--c-border); }
.ac-clasico .ac-nav-inner{ display:flex; flex-direction:column; align-items:center; gap:14px; padding-block:18px; text-align:center; }
.ac-clasico .ac-nav-logo strong{ display:block; font-family: var(--font-ac-display), serif; font-weight:700; font-size:1.3rem; color:var(--c-primary); }
.ac-clasico .ac-nav-logo span{ display:block; font-size:.78rem; color:var(--c-muted); margin-top:2px; }
.ac-clasico .ac-nav-row{ display:flex; align-items:center; gap:28px; font-size:.82rem; font-weight:600; color:var(--c-muted); }
.ac-clasico .ac-nav-row a:hover{ color:var(--c-accent); }
@media (max-width:760px){ .ac-clasico .ac-nav-row{ flex-wrap:wrap; justify-content:center; gap:16px 20px; } }

.ac-clasico .ac-hero{
  padding-block:72px 80px; text-align:center; position:relative;
  background:
    radial-gradient(900px 420px at 50% -18%, rgba(201,168,76,.14), transparent 62%),
    linear-gradient(180deg, var(--c-bg2) 0%, var(--c-bg) 65%);
}
.ac-clasico .ac-hero-photo-wrap{ width:220px; height:220px; margin-inline:auto; padding:6px; border:1px solid var(--c-accent); border-radius:50%; box-shadow:0 20px 44px rgba(26,39,68,.16); }
.ac-clasico .ac-hero-photo{ width:100%; height:100%; border-radius:50%; overflow:hidden; border:1px solid var(--c-accent); background:var(--c-bg2); }
.ac-clasico .ac-hero-photo .ac-avatar-fallback{ font-size:3.2rem; }
.ac-clasico .ac-hero-copy{ max-width:640px; margin-inline:auto; margin-top:30px; }
.ac-clasico .ac-hero-copy h1{ font-size:clamp(2rem,4.4vw,2.9rem); line-height:1.2; margin-block:14px 12px; color:var(--c-primary); overflow-wrap:anywhere; }
.ac-clasico .ac-lead{ color:var(--c-muted); font-size:1.05rem; margin-bottom:30px; }
.ac-clasico .ac-hero-actions{ display:flex; flex-wrap:wrap; justify-content:center; gap:14px; }

.ac-clasico .ac-section{ padding-block:80px; }
.ac-clasico .ac-section-head{ text-align:center; max-width:620px; margin:0 auto 48px; }
.ac-clasico .ac-section-head h2{ font-size:clamp(1.6rem,3.2vw,2.2rem); margin-top:10px; color:var(--c-primary); }
@media (max-width:600px){ .ac-clasico .ac-section{ padding-block:56px; } }

.ac-clasico .ac-services-list{ max-width:760px; margin-inline:auto; display:flex; flex-direction:column; gap:18px; }
.ac-clasico .ac-service-row{
  display:grid; grid-template-columns:64px 1fr; gap:22px; align-items:flex-start;
  padding:26px 26px; border:1px solid var(--c-border); border-radius:10px;
  box-shadow:0 8px 24px rgba(26,39,68,.05); transition:transform .2s ease, box-shadow .2s ease;
}
.ac-clasico .ac-service-row:hover{ transform:translateY(-3px); box-shadow:0 16px 32px rgba(26,39,68,.1); }
.ac-clasico .ac-service-medallion{
  display:flex; align-items:center; justify-content:center; width:56px; height:56px; border-radius:50%;
  border:1px solid var(--c-accent); background:var(--c-accent-lt); font-size:1.5rem;
}
.ac-clasico .ac-service-row h3{ font-size:1.2rem; color:var(--c-text); margin-bottom:6px; }
.ac-clasico .ac-service-row p{ color:var(--c-muted); font-size:.94rem; }
@media (max-width:600px){ .ac-clasico .ac-service-row{ grid-template-columns:48px 1fr; padding:20px; } }

.ac-clasico .ac-whyus-grid{ display:grid; grid-template-columns:repeat(4,1fr); gap:32px; max-width:920px; margin-inline:auto; }
.ac-clasico .ac-whyus-item{ display:flex; flex-direction:column; align-items:center; text-align:center; gap:14px; padding-top:24px; border-top:2px solid var(--c-accent); }
.ac-clasico .ac-whyus-icon{ font-size:2rem; }
.ac-clasico .ac-whyus-item p{ font-weight:600; color:var(--c-primary); font-size:.96rem; }
@media (max-width:860px){ .ac-clasico .ac-whyus-grid{ grid-template-columns:1fr 1fr; } }
@media (max-width:480px){ .ac-clasico .ac-whyus-grid{ grid-template-columns:1fr; } }

.ac-clasico .ac-process{ background:var(--c-primary); color:#fff; }
.ac-clasico .ac-process .ac-section-head h2{ color:#fff; }
.ac-clasico .ac-process .ac-eyebrow{ color:#D9C089; }
.ac-clasico .ac-timeline{ position:relative; max-width:560px; margin-inline:auto; padding-left:52px; }
.ac-clasico .ac-timeline::before{ content:""; position:absolute; left:19px; top:6px; bottom:6px; width:1px; background:rgba(255,255,255,.3); }
.ac-clasico .ac-timeline-step{ position:relative; padding-bottom:40px; }
.ac-clasico .ac-timeline-step:last-child{ padding-bottom:0; }
.ac-clasico .ac-timeline-marker{
  position:absolute; left:-52px; top:0; width:40px; height:40px; border-radius:50%; border:1px solid #D9C089;
  display:flex; align-items:center; justify-content:center; font-family: var(--font-ac-display), serif; font-weight:700;
  color:#D9C089; background:var(--c-primary);
}
.ac-clasico .ac-timeline-step h3{ font-size:1.1rem; color:#fff; margin-bottom:6px; }
.ac-clasico .ac-timeline-step p{ color:rgba(255,255,255,.7); font-size:.92rem; }

.ac-clasico .ac-about-cols{ display:grid; grid-template-columns:1fr 1fr; gap:40px; max-width:920px; margin-inline:auto; }
.ac-clasico .ac-about-cols p{ color:var(--c-text); font-size:.98rem; margin-bottom:16px; }
.ac-clasico .ac-dropcap::first-letter{
  float:left; font-family: var(--font-ac-display), serif; font-weight:700; font-size:3.4rem;
  line-height:.85; color:var(--c-accent); padding-right:10px; padding-top:4px;
}
.ac-clasico .ac-credentials-table{ max-width:640px; margin:48px auto 0; border:1px solid var(--c-border); border-radius:10px; overflow:hidden; box-shadow:0 8px 24px rgba(26,39,68,.05); }
.ac-clasico .ac-row{ display:grid; grid-template-columns:180px 1fr; border-bottom:1px solid var(--c-border); }
.ac-clasico .ac-row:last-child{ border-bottom:none; }
.ac-clasico .ac-k{ padding:14px 18px; font-size:.78rem; font-weight:600; color:var(--c-muted); border-right:1px solid var(--c-border); background:var(--c-bg2); }
.ac-clasico .ac-v{ padding:14px 18px; font-size:.92rem; color:var(--c-text); }
@media (max-width:760px){
  .ac-clasico .ac-about-cols{ grid-template-columns:1fr; }
  .ac-clasico .ac-row{ grid-template-columns:140px 1fr; }
}

.ac-clasico .ac-testimonials-grid{ display:grid; grid-template-columns:repeat(3,1fr); gap:24px; }
.ac-clasico .ac-testimonial-card{
  background:var(--c-bg2); border:1px solid var(--c-border); border-radius:10px; padding:34px 28px 28px;
  box-shadow:0 8px 24px rgba(26,39,68,.05); display:flex; flex-direction:column; gap:14px; text-align:center;
  transition:transform .2s ease, box-shadow .2s ease;
}
.ac-clasico .ac-testimonial-card:hover{ transform:translateY(-4px); box-shadow:0 16px 32px rgba(26,39,68,.1); }
.ac-clasico .ac-testimonial-mark{ font-family: var(--font-ac-display), serif; font-size:2.6rem; color:var(--c-accent); line-height:1; }
.ac-clasico .ac-testimonial-quote{ font-size:.98rem; color:var(--c-text); font-style:italic; line-height:1.7; }
.ac-clasico .ac-testimonial-author{ display:flex; flex-direction:column; gap:2px; margin-top:4px; }
.ac-clasico .ac-testimonial-name{ font-weight:700; color:var(--c-primary); font-size:.92rem; }
.ac-clasico .ac-testimonial-role{ font-size:.82rem; color:var(--c-muted); }
@media (max-width:920px){ .ac-clasico .ac-testimonials-grid{ grid-template-columns:1fr 1fr; } }
@media (max-width:600px){ .ac-clasico .ac-testimonials-grid{ grid-template-columns:1fr; } }

.ac-clasico .ac-faq-list{ max-width:760px; margin-inline:auto; }
.ac-clasico .ac-faq-block{ padding-block:22px; border-bottom:1px solid var(--c-border); }
.ac-clasico .ac-faq-block:last-child{ border-bottom:none; }
.ac-clasico .ac-faq-q{ font-weight:700; font-size:1rem; color:var(--c-primary); margin-bottom:10px; }
.ac-clasico .ac-faq-a{ color:var(--c-muted); font-size:.94rem; }

.ac-clasico .ac-cta-banner{ background:var(--c-primary); color:#fff; padding-block:68px; text-align:center; }
.ac-clasico .ac-cta-banner h2{ color:#fff; font-size:clamp(1.6rem,3.2vw,2.2rem); margin-bottom:12px; }
.ac-clasico .ac-cta-banner p{ color:rgba(255,255,255,.75); font-size:1rem; margin-bottom:12px; }
.ac-clasico .ac-cta-schedule{ font-size:.88rem; font-weight:600; color:#D9C089; margin-bottom:26px !important; }

.ac-clasico .ac-footer{ background:var(--c-bg2); border-top:1px solid var(--c-border); padding-block:44px 26px; text-align:center; }
.ac-clasico .ac-footer-seal{ width:56px; height:56px; margin:0 auto 16px; color:var(--c-accent); }
.ac-clasico .ac-footer-name{ font-family: var(--font-ac-display), serif; font-weight:700; font-size:1.15rem; color:var(--c-primary); }
.ac-clasico .ac-footer-line{ font-size:.86rem; color:var(--c-muted); margin-top:8px; overflow-wrap:anywhere; }
.ac-clasico .ac-footer-sep{ color:var(--c-accent); margin-inline:8px; }
.ac-clasico .ac-footer-disclaimer{ max-width:60ch; margin:22px auto 0; font-size:.76rem; color:var(--c-muted); line-height:1.6; }
.ac-clasico .ac-footer-bottom{ margin-top:14px; font-size:.76rem; color:var(--c-muted); }

.ac-clasico .ac-whatsapp-float{
  position:fixed; right:20px; bottom:20px; z-index:60;
  width:54px; height:54px; border-radius:50%; background:var(--c-accent); color:#fff;
  display:flex; align-items:center; justify-content:center; border:1px solid var(--c-primary);
  transition:transform .18s ease;
}
.ac-clasico .ac-whatsapp-float svg{ width:24px; height:24px; }
.ac-clasico .ac-whatsapp-float:hover{ transform:scale(1.06); }
`;
