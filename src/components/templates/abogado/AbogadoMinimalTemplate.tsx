import { Inter } from "next/font/google";
import type { SectionConfigItem } from "@/lib/landings/update-landing";
import { serviceEntries } from "@/lib/professions/abogados";
import { buildWaLink } from "@/lib/whatsapp";
import { getInitials } from "@/lib/avatar-initials";
import type { AbogadoFormData } from "./AbogadoModernoTemplate";

// Ported from templates/abogado-minimal.html. Same content rules as the
// other two abogado templates: proceso/FAQ fixed generic copy,
// testimonios/trust-bar/posgrado omitted (not collected).
const inter = Inter({
  weight: ["300", "400", "500", "600", "700"],
  subsets: ["latin"],
  variable: "--font-am-body",
});

const DEFAULT_PRIMARY = "#0F0F0F";

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
  return <span className="am-avatar-fallback">{getInitials(name)}</span>;
}

export function AbogadoMinimalTemplate({
  formData,
  sectionsConfig,
  subdomain,
  colorPrimary = DEFAULT_PRIMARY,
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
      className={`${inter.variable} am-minimal`}
      style={
        {
          "--c-primary": colorPrimary,
          "--c-bg": "#FFFFFF",
          "--c-bg2": "#FAFAFA",
          "--c-text": "#0F0F0F",
          "--c-muted": "#888888",
          "--c-border": "#E8E8E8",
        } as React.CSSProperties
      }
    >
      <style>{CSS}</style>

      <header className="am-nav">
        <div className="am-container am-nav-inner">
          <span className="am-nav-name">{name || "Tu nombre"}</span>
          {showContact && (
            <a className="am-nav-contact" href="#contacto">Contacto</a>
          )}
        </div>
      </header>

      {showHero && (
        <section className="am-hero" id="top">
          <div className="am-hero-grid">
            <div className="am-hero-copy am-container">
              <span className="am-hero-eyebrow am-uc">
                {especialidadPrincipal}
                {especialidadPrincipal && formData.matricula_numero ? " · " : ""}
                {formData.matricula_numero ? `Mat. Nº ${formData.matricula_numero}` : ""}
              </span>
              <h1>{name || "Tu nombre"}</h1>
              {formData.descripcion_corta && (
                <p className="am-lead">{formData.descripcion_corta}</p>
              )}
              <div className="am-hero-actions">
                {waLink && (
                  <a className="am-link-cta" href={waLink} target="_blank" rel="noopener">
                    Consultá ahora
                  </a>
                )}
                {showServices && services.length > 0 && (
                  <a className="am-link-cta" href="#servicios">
                    Ver servicios
                  </a>
                )}
              </div>
            </div>
            <div className="am-hero-photo">
              <Avatar name={name} photoUrl={formData.profile_image} />
            </div>
          </div>
        </section>
      )}

      {showServices && services.length > 0 && (
        <section className="am-section" id="servicios">
          <div className="am-container">
            <div className="am-section-head">
              <h2>Áreas de práctica</h2>
            </div>
            <div className="am-services-list">
              {services.map((s, i) => (
                <div key={s.value} className="am-service-row">
                  <span className="am-service-num">{String(i + 1).padStart(2, "0")}</span>
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

      <section className="am-section" id="proceso">
        <div className="am-container">
          <div className="am-section-head">
            <h2>Cómo trabajo</h2>
          </div>
          <div className="am-process-grid">
            {PROCESO.map((step, i) => (
              <div key={step.titulo} className="am-process-step">
                <span className="am-num am-uc">{`Paso ${String(i + 1).padStart(2, "0")}`}</span>
                <h3>{step.titulo}</h3>
                <p>{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {showAbout && (
        <section className="am-section" id="sobre-mi">
          <div className="am-container">
            <div className="am-section-head">
              <h2>Sobre {name || "Tu nombre"}</h2>
            </div>
            <div className="am-about-copy">
              {formData.descripcion_corta && <p>{formData.descripcion_corta}</p>}
              <div className="am-credentials-list">
                {(formData.universidad || formData.año_graduacion) && (
                  <p className="am-credential-line">
                    {formData.universidad}
                    {formData.universidad && formData.año_graduacion ? " — " : ""}
                    {formData.año_graduacion}
                  </p>
                )}
                {formData.matricula_numero && (
                  <p className="am-credential-line">
                    Matrícula Nº {formData.matricula_numero}
                    {formData.matricula_colegio ? ` — ${formData.matricula_colegio}` : ""}
                  </p>
                )}
                {formData.asociacion_profesional && (
                  <p className="am-credential-line">{formData.asociacion_profesional}</p>
                )}
              </div>
            </div>
          </div>
        </section>
      )}

      <section className="am-section" id="faq">
        <div className="am-container">
          <div className="am-section-head">
            <h2>Preguntas frecuentes</h2>
          </div>
          <div className="am-faq-list">
            {FAQ.map((item) => (
              <details key={item.q} className="am-faq-item">
                <summary>
                  {item.q}
                  <span className="am-faq-toggle">+</span>
                </summary>
                <p className="am-faq-answer">{item.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {showContact && waLink && (
        <section className="am-cta" id="contacto">
          <div className="am-container">
            <h2>¿Tenés una consulta legal? Primera consulta sin costo.</h2>
            <a className="am-cta-phone" href={waLink} target="_blank" rel="noopener">
              {formData.phone}
            </a>
          </div>
        </section>
      )}

      <footer className="am-footer">
        <div className="am-container">
          <p className="am-footer-line">
            {name || "Tu nombre"}
            {formData.matricula_numero && (
              <>
                <span className="am-sep">·</span>
                {`Mat. Nº ${formData.matricula_numero}`}
              </>
            )}
            {formData.email && (
              <>
                <span className="am-sep">·</span>
                {formData.email}
              </>
            )}
            {formData.ciudad && (
              <>
                <span className="am-sep">·</span>
                {formData.ciudad}
              </>
            )}
            <span className="am-sep">·</span>
            {year}
            {isRealUrl(formData.linkedin_url) && (
              <>
                <span className="am-sep">·</span>
                <a className="am-link-cta" href={formData.linkedin_url} target="_blank" rel="noopener">
                  LinkedIn
                </a>
              </>
            )}
          </p>
          {subdomain && (
            <p className="am-footer-disclaimer">{`${subdomain}.weboficial.com.ar`}</p>
          )}
          {(formData.direccion || formData.provincia) && (
            <p className="am-footer-disclaimer">
              {[formData.direccion, formData.ciudad, formData.provincia].filter(Boolean).join(", ")}
            </p>
          )}
          <p className="am-footer-disclaimer">
            La información en este sitio no constituye asesoramiento legal. Consultá con un profesional para tu caso específico.
          </p>
        </div>
      </footer>

      {waLink && (
        <a className="am-whatsapp-float" href={waLink} target="_blank" rel="noopener" aria-label="Contactar por WhatsApp">
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
.am-minimal{
  font-family: var(--font-am-body), -apple-system, BlinkMacSystemFont, sans-serif;
  font-weight:400;
  color: var(--c-text);
  background: var(--c-bg);
  line-height: 1.6;
  overflow-x: hidden;
  scroll-behavior: smooth;
  -webkit-font-smoothing: antialiased;
}
.am-minimal *, .am-minimal *::before, .am-minimal *::after{ box-sizing: border-box; }
.am-minimal img{ max-width:100%; display:block; }
.am-minimal a{ color:inherit; text-decoration:none; }
.am-minimal h1, .am-minimal h2, .am-minimal h3{ margin:0; font-family: var(--font-am-body), sans-serif; font-weight:500; }
.am-minimal p{ margin:0; overflow-wrap:anywhere; }
.am-minimal section{ min-width:0; }
.am-minimal svg{ flex-shrink:0; }
.am-minimal .am-container{ width:100%; max-width:1160px; margin-inline:auto; padding-inline:clamp(16px,4vw,32px); }
.am-minimal .am-uc{ text-transform:uppercase; letter-spacing:.12em; }

.am-minimal .am-link-cta{
  display:inline-block; font-weight:500; font-size:.95rem;
  border-bottom:1px solid var(--c-text); padding-bottom:2px; transition:opacity .15s ease;
}
.am-minimal .am-link-cta:hover{ opacity:.55; }

.am-minimal .am-avatar-fallback{
  display:flex; align-items:center; justify-content:center; width:100%; height:100%;
  background:var(--c-primary); color:#fff; font-weight:300;
}

.am-minimal .am-nav{ position:sticky; top:0; z-index:50; background:var(--c-bg); border-bottom:1px solid var(--c-border); }
.am-minimal .am-nav-inner{ display:flex; align-items:center; justify-content:space-between; padding-block:22px; }
.am-minimal .am-nav-name{ font-weight:300; font-size:1.1rem; letter-spacing:.06em; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
.am-minimal .am-nav-contact{ font-weight:500; font-size:.9rem; flex-shrink:0; }
.am-minimal .am-nav-contact:hover{ opacity:.55; }

.am-minimal .am-hero{ padding-block:0; }
.am-minimal .am-hero-grid{ display:grid; grid-template-columns:1.15fr .85fr; align-items:stretch; min-height:520px; }
.am-minimal .am-hero-copy{ display:flex; flex-direction:column; justify-content:center; padding-block:56px; padding-right:56px; }
.am-minimal .am-hero-eyebrow{ font-size:.82rem; color:var(--c-muted); margin-bottom:20px; overflow-wrap:anywhere; }
.am-minimal .am-hero-copy h1{
  font-size:clamp(3rem,8vw,7rem); font-weight:300; line-height:.98; letter-spacing:-.02em;
  overflow-wrap:anywhere; margin-bottom:22px;
}
.am-minimal .am-lead{ color:var(--c-muted); font-size:1rem; max-width:48ch; margin-bottom:28px; }
.am-minimal .am-hero-actions{ display:flex; flex-wrap:wrap; gap:24px; }
.am-minimal .am-hero-photo{ width:100%; height:100%; aspect-ratio:3/4; background:var(--c-bg2); overflow:hidden; }
.am-minimal .am-hero-photo .am-avatar-fallback{ font-size:5rem; aspect-ratio:3/4; }
@media (max-width:860px){
  .am-minimal .am-hero-grid{ grid-template-columns:1fr; min-height:0; }
  .am-minimal .am-hero-copy{ padding-inline:0; order:2; padding-block:36px; }
  .am-minimal .am-hero-photo{ order:1; aspect-ratio:4/3; }
  .am-minimal .am-hero-photo .am-avatar-fallback{ aspect-ratio:4/3; }
}

.am-minimal .am-section{ padding-block:80px; }
.am-minimal .am-section-head{ margin-bottom:40px; }
.am-minimal .am-section-head h2{ font-size:1.5rem; font-weight:400; }
@media (max-width:600px){ .am-minimal .am-section{ padding-block:52px; } }

.am-minimal .am-services-list{ border-top:1px solid var(--c-border); }
.am-minimal .am-service-row{ display:grid; grid-template-columns:64px 1fr; gap:24px; padding-block:26px; border-bottom:1px solid var(--c-border); }
.am-minimal .am-service-num{ font-size:.9rem; color:var(--c-muted); }
.am-minimal .am-service-row h3{ font-size:1.1rem; font-weight:500; margin-bottom:6px; }
.am-minimal .am-service-row p{ color:var(--c-muted); font-size:.92rem; }
@media (max-width:600px){ .am-minimal .am-service-row{ grid-template-columns:40px 1fr; } }

.am-minimal .am-process-grid{ display:grid; grid-template-columns:repeat(4,1fr); gap:32px; }
.am-minimal .am-num{ display:block; font-size:.75rem; color:var(--c-muted); margin-bottom:14px; }
.am-minimal .am-process-step h3{ font-size:1.1rem; font-weight:500; margin-bottom:8px; }
.am-minimal .am-process-step p{ font-size:.9rem; color:var(--c-muted); }
@media (max-width:760px){ .am-minimal .am-process-grid{ grid-template-columns:1fr 1fr; } }
@media (max-width:480px){ .am-minimal .am-process-grid{ grid-template-columns:1fr; } }

.am-minimal .am-about-copy{ max-width:65ch; }
.am-minimal .am-about-copy p{ font-size:1.02rem; color:var(--c-text); margin-bottom:18px; }
.am-minimal .am-credentials-list{ margin-top:36px; display:flex; flex-direction:column; gap:10px; }
.am-minimal .am-credential-line{ font-size:.92rem; color:var(--c-muted); }
.am-minimal .am-credential-line::before{ content:"— "; color:var(--c-text); }

.am-minimal .am-faq-list{ border-top:1px solid var(--c-border); }
.am-minimal .am-faq-item{ border-bottom:1px solid var(--c-border); }
.am-minimal .am-faq-item summary{
  list-style:none; display:flex; align-items:center; justify-content:space-between; gap:16px;
  padding-block:22px; font-weight:500; font-size:1rem; cursor:pointer;
}
.am-minimal .am-faq-item summary::-webkit-details-marker{ display:none; }
.am-minimal .am-faq-toggle{ display:inline-block; font-size:1.1rem; font-weight:300; color:var(--c-muted); flex-shrink:0; transition:transform .15s ease; }
.am-minimal .am-faq-item[open] .am-faq-toggle{ transform:rotate(45deg); }
.am-minimal .am-faq-answer{ color:var(--c-muted); font-size:.94rem; line-height:1.7; padding-bottom:22px; max-width:66ch; }

.am-minimal .am-cta{ text-align:center; padding-block:100px; }
.am-minimal .am-cta h2{ font-size:clamp(1.6rem,3.4vw,2.3rem); font-weight:300; margin-bottom:28px; }
.am-minimal .am-cta-phone{
  display:inline-block; max-width:100%; overflow-wrap:anywhere;
  font-size:clamp(1.8rem,5vw,3rem); font-weight:300; border-bottom:1px solid var(--c-text); padding-bottom:6px;
}
.am-minimal .am-cta-phone:hover{ opacity:.6; }

.am-minimal .am-footer{ border-top:1px solid var(--c-border); padding-block:32px; }
.am-minimal .am-footer-line{ font-size:.86rem; color:var(--c-text); overflow-wrap:anywhere; }
.am-minimal .am-sep{ color:var(--c-border); margin-inline:10px; }
.am-minimal .am-footer-disclaimer{ font-size:.76rem; color:var(--c-muted); margin-top:10px; max-width:70ch; }
@media (max-width:600px){ .am-minimal .am-footer-line{ line-height:1.9; } }

.am-minimal .am-whatsapp-float{
  position:fixed; right:20px; bottom:20px; z-index:60;
  width:52px; height:52px; border-radius:50%; background:#0F0F0F; color:#fff;
  display:flex; align-items:center; justify-content:center;
}
.am-minimal .am-whatsapp-float svg{ width:22px; height:22px; }
`;
