import { Playfair_Display, Source_Serif_4 } from "next/font/google";
import type { SectionConfigItem } from "@/lib/landings/update-landing";
import { serviceEntries } from "@/lib/professions/abogados";
import { buildWaLink } from "@/lib/whatsapp";
import { getInitials } from "@/lib/avatar-initials";
import type { AbogadoFormData } from "./AbogadoModernoTemplate";

// Ported from templates/abogado-clasico.html. Same content rules as
// AbogadoModernoTemplate.tsx: proceso/FAQ are fixed generic copy,
// testimonios/trust-bar/posgrado are omitted (not collected by the
// wizard, so no real data to show).
const playfair = Playfair_Display({
  weight: ["400", "700"],
  style: ["normal", "italic"],
  subsets: ["latin"],
  variable: "--font-ac-display",
});
const sourceSerif = Source_Serif_4({
  weight: ["400", "500", "600", "700"],
  subsets: ["latin"],
  variable: "--font-ac-body",
});

const DEFAULT_PRIMARY = "#1A0A00";
const DEFAULT_ACCENT = "#8B1A1A";

const ROMAN = ["I", "II", "III", "IV", "V", "VI"];

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
  const services = serviceEntries(formData.servicios ?? []);
  const especialidadPrincipal = services[0]?.label ?? "";
  const waLink = formData.phone ? buildWaLink(formData.phone) : null;
  const year = new Date().getFullYear();

  return (
    <div
      className={`${playfair.variable} ${sourceSerif.variable} ac-clasico`}
      style={
        {
          "--c-primary": colorPrimary,
          "--c-accent": colorAccent,
          "--c-bg": "#FAF7F2",
          "--c-bg2": "#F0EBE3",
          "--c-text": "#1A0A00",
          "--c-muted": "#7A6A5A",
          "--c-border": "#D4C5B0",
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
              {formData.descripcion_corta && (
                <p className="ac-lead">{formData.descripcion_corta}</p>
              )}
              <div className="ac-hero-actions">
                {waLink && (
                  <a className="ac-btn ac-btn-primary" href={waLink} target="_blank" rel="noopener">
                    Consultá ahora
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
            <div className="ac-section-head">
              <span className="ac-eyebrow ac-uc">Servicios</span>
              <h2>Áreas de Práctica</h2>
            </div>
            <div className="ac-services-list">
              {services.map((s, i) => (
                <div key={s.value} className="ac-service-row">
                  <span className="ac-service-numeral">{ROMAN[i] ?? i + 1}</span>
                  <div>
                    <h3>{s.label}</h3>
                    <p>{s.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      <section className="ac-section ac-process" id="proceso">
        <div className="ac-container">
          <div className="ac-section-head">
            <span className="ac-eyebrow ac-uc">Metodología</span>
            <h2>Cómo trabajo</h2>
          </div>
          <div className="ac-timeline">
            {PROCESO.map((step, i) => (
              <div key={step.titulo} className="ac-timeline-step">
                <span className="ac-timeline-marker">{i + 1}</span>
                <h3>{step.titulo}</h3>
                <p>{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {showAbout && (
        <section className="ac-section" id="sobre-mi">
          <div className="ac-container">
            <div className="ac-section-head">
              <span className="ac-eyebrow ac-uc">Trayectoria</span>
              <h2>Sobre {name || "Tu nombre"}</h2>
            </div>
            {formData.descripcion_corta && (
              <div className="ac-about-cols">
                <p className="ac-dropcap">{formData.descripcion_corta}</p>
              </div>
            )}
            <div className="ac-credentials-table">
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
            </div>
          </div>
        </section>
      )}

      <section className="ac-section" id="faq">
        <div className="ac-container">
          <div className="ac-section-head">
            <span className="ac-eyebrow ac-uc">Dudas frecuentes</span>
            <h2>Preguntas Frecuentes</h2>
          </div>
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
          {isRealUrl(formData.linkedin_url) && (
            <p className="ac-footer-line">
              <a href={formData.linkedin_url} target="_blank" rel="noopener">
                LinkedIn
              </a>
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

      {waLink && (
        <a className="ac-whatsapp-float" href={waLink} target="_blank" rel="noopener" aria-label="Contactar por WhatsApp">
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
  padding:14px 30px; border-radius:0; font-weight:600; font-size:.86rem;
  border:1px solid var(--c-primary); cursor:pointer;
  transition:background-color .15s ease, color .15s ease; white-space:nowrap;
}
.ac-clasico .ac-btn-primary{ background:var(--c-primary); color:var(--c-bg); }
.ac-clasico .ac-btn-primary:hover{ background:var(--c-accent); border-color:var(--c-accent); }
.ac-clasico .ac-btn-outline{ background:transparent; color:var(--c-primary); }
.ac-clasico .ac-btn-outline:hover{ background:var(--c-primary); color:var(--c-bg); }
.ac-clasico .ac-btn-ivory{ background:transparent; color:#FAF7F2; border:1px solid #FAF7F2; }
.ac-clasico .ac-btn-ivory:hover{ background:#FAF7F2; color:var(--c-primary); }

.ac-clasico .ac-avatar-fallback{
  display:flex; align-items:center; justify-content:center; width:100%; height:100%;
  border-radius:50%; background:linear-gradient(135deg,var(--c-primary),var(--c-accent));
  color:var(--c-bg); font-family: var(--font-ac-display), serif; font-weight:700;
}

.ac-clasico .ac-nav{ position:sticky; top:0; z-index:50; background:var(--c-bg); }
.ac-clasico .ac-nav-rule{ height:1px; background:var(--c-border); }
.ac-clasico .ac-nav-inner{ display:flex; flex-direction:column; align-items:center; gap:14px; padding-block:18px; text-align:center; }
.ac-clasico .ac-nav-logo strong{ display:block; font-family: var(--font-ac-display), serif; font-weight:700; font-size:1.3rem; color:var(--c-primary); }
.ac-clasico .ac-nav-logo span{ display:block; font-size:.78rem; color:var(--c-muted); margin-top:2px; }
.ac-clasico .ac-nav-row{ display:flex; align-items:center; gap:28px; font-size:.82rem; font-weight:600; color:var(--c-muted); }
.ac-clasico .ac-nav-row a:hover{ color:var(--c-accent); }
@media (max-width:760px){ .ac-clasico .ac-nav-row{ flex-wrap:wrap; justify-content:center; gap:16px 20px; } }

.ac-clasico .ac-hero{ padding-block:64px 72px; text-align:center; }
.ac-clasico .ac-hero-photo-wrap{ width:200px; height:200px; margin-inline:auto; padding:6px; border:1px solid var(--c-accent); border-radius:50%; }
.ac-clasico .ac-hero-photo{ width:100%; height:100%; border-radius:50%; overflow:hidden; border:1px solid var(--c-accent); background:var(--c-bg2); }
.ac-clasico .ac-hero-photo .ac-avatar-fallback{ font-size:3rem; }
.ac-clasico .ac-hero-copy{ max-width:640px; margin-inline:auto; margin-top:28px; }
.ac-clasico .ac-hero-copy h1{ font-size:clamp(2rem,4.4vw,2.9rem); line-height:1.2; margin-block:14px 12px; color:var(--c-primary); overflow-wrap:anywhere; }
.ac-clasico .ac-lead{ color:var(--c-muted); font-size:1rem; margin-bottom:28px; }
.ac-clasico .ac-hero-actions{ display:flex; flex-wrap:wrap; justify-content:center; gap:14px; }

.ac-clasico .ac-section{ padding-block:76px; }
.ac-clasico .ac-section-head{ text-align:center; max-width:620px; margin:0 auto 44px; }
.ac-clasico .ac-section-head h2{ font-size:clamp(1.6rem,3.2vw,2.2rem); margin-top:10px; color:var(--c-primary); }
@media (max-width:600px){ .ac-clasico .ac-section{ padding-block:52px; } }

.ac-clasico .ac-services-list{ max-width:760px; margin-inline:auto; display:flex; flex-direction:column; }
.ac-clasico .ac-service-row{
  display:grid; grid-template-columns:56px 1fr; gap:20px; padding-block:24px;
  border-left:2px solid var(--c-accent); padding-left:24px; border-bottom:1px solid var(--c-border);
}
.ac-clasico .ac-service-row:last-child{ border-bottom:none; }
.ac-clasico .ac-service-numeral{ font-family: var(--font-ac-display), serif; font-weight:700; font-size:1.6rem; color:var(--c-accent); }
.ac-clasico .ac-service-row h3{ font-size:1.2rem; color:var(--c-text); margin-bottom:6px; }
.ac-clasico .ac-service-row p{ color:var(--c-muted); font-size:.94rem; }
@media (max-width:600px){ .ac-clasico .ac-service-row{ grid-template-columns:40px 1fr; padding-left:16px; } }

.ac-clasico .ac-process{ background:var(--c-primary); color:var(--c-bg); }
.ac-clasico .ac-process .ac-section-head h2{ color:var(--c-bg); }
.ac-clasico .ac-process .ac-eyebrow{ color:#D9A0A0; }
.ac-clasico .ac-timeline{ position:relative; max-width:560px; margin-inline:auto; padding-left:52px; }
.ac-clasico .ac-timeline::before{ content:""; position:absolute; left:19px; top:6px; bottom:6px; width:1px; background:rgba(250,247,242,.3); }
.ac-clasico .ac-timeline-step{ position:relative; padding-bottom:40px; }
.ac-clasico .ac-timeline-step:last-child{ padding-bottom:0; }
.ac-clasico .ac-timeline-marker{
  position:absolute; left:-52px; top:0; width:40px; height:40px; border-radius:50%; border:1px solid #D9A0A0;
  display:flex; align-items:center; justify-content:center; font-family: var(--font-ac-display), serif; font-weight:700;
  color:#D9A0A0; background:var(--c-primary);
}
.ac-clasico .ac-timeline-step h3{ font-size:1.1rem; color:var(--c-bg); margin-bottom:6px; }
.ac-clasico .ac-timeline-step p{ color:rgba(250,247,242,.7); font-size:.92rem; }

.ac-clasico .ac-about-cols{ display:grid; grid-template-columns:1fr 1fr; gap:40px; max-width:920px; margin-inline:auto; }
.ac-clasico .ac-about-cols p{ color:var(--c-text); font-size:.98rem; margin-bottom:16px; }
.ac-clasico .ac-dropcap::first-letter{
  float:left; font-family: var(--font-ac-display), serif; font-weight:700; font-size:3.4rem;
  line-height:.85; color:var(--c-accent); padding-right:10px; padding-top:4px;
}
.ac-clasico .ac-credentials-table{ max-width:640px; margin:48px auto 0; border:1px solid var(--c-border); }
.ac-clasico .ac-row{ display:grid; grid-template-columns:180px 1fr; border-bottom:1px solid var(--c-border); }
.ac-clasico .ac-row:last-child{ border-bottom:none; }
.ac-clasico .ac-k{ padding:14px 18px; font-size:.78rem; font-weight:600; color:var(--c-muted); border-right:1px solid var(--c-border); }
.ac-clasico .ac-v{ padding:14px 18px; font-size:.92rem; color:var(--c-text); }
@media (max-width:760px){
  .ac-clasico .ac-about-cols{ grid-template-columns:1fr; }
  .ac-clasico .ac-row{ grid-template-columns:140px 1fr; }
}

.ac-clasico .ac-faq-list{ max-width:760px; margin-inline:auto; }
.ac-clasico .ac-faq-block{ padding-block:22px; border-bottom:1px solid var(--c-border); }
.ac-clasico .ac-faq-block:last-child{ border-bottom:none; }
.ac-clasico .ac-faq-q{ font-weight:700; font-size:1rem; color:var(--c-primary); margin-bottom:10px; }
.ac-clasico .ac-faq-a{ color:var(--c-muted); font-size:.94rem; }

.ac-clasico .ac-cta-banner{ background:var(--c-primary); color:var(--c-bg); padding-block:64px; text-align:center; }
.ac-clasico .ac-cta-banner h2{ color:var(--c-bg); font-size:clamp(1.6rem,3.2vw,2.2rem); margin-bottom:12px; }
.ac-clasico .ac-cta-banner p{ color:rgba(250,247,242,.75); font-size:1rem; margin-bottom:26px; }

.ac-clasico .ac-footer{ background:var(--c-bg2); border-top:1px solid var(--c-border); padding-block:44px 26px; text-align:center; }
.ac-clasico .ac-footer-seal{ width:56px; height:56px; margin:0 auto 16px; color:var(--c-accent); }
.ac-clasico .ac-footer-name{ font-family: var(--font-ac-display), serif; font-weight:700; font-size:1.15rem; color:var(--c-primary); }
.ac-clasico .ac-footer-line{ font-size:.86rem; color:var(--c-muted); margin-top:8px; overflow-wrap:anywhere; }
.ac-clasico .ac-footer-sep{ color:var(--c-accent); margin-inline:8px; }
.ac-clasico .ac-footer-disclaimer{ max-width:60ch; margin:22px auto 0; font-size:.76rem; color:var(--c-muted); line-height:1.6; }
.ac-clasico .ac-footer-bottom{ margin-top:14px; font-size:.76rem; color:var(--c-muted); }

.ac-clasico .ac-whatsapp-float{
  position:fixed; right:20px; bottom:20px; z-index:60;
  width:54px; height:54px; border-radius:50%; background:var(--c-accent); color:var(--c-bg);
  display:flex; align-items:center; justify-content:center; border:1px solid var(--c-primary);
  transition:transform .18s ease;
}
.ac-clasico .ac-whatsapp-float svg{ width:24px; height:24px; }
.ac-clasico .ac-whatsapp-float:hover{ transform:scale(1.06); }
`;
