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
import type { AbogadoFormData } from "./AbogadoModernoTemplate";

// Ported from templates/abogado-minimal.html. Same content rules as the
// other two abogado templates: proceso/FAQ fixed generic copy. Servicios,
// "Por qué elegirnos" and Testimonios render the professional's own data --
// testimonios stays hidden entirely when there's none (never fabricate
// quotes).
const playfair = Playfair_Display({
  weight: ["400", "700"],
  style: ["normal", "italic"],
  subsets: ["latin"],
  variable: "--font-am-display",
});
const inter = Inter({
  weight: ["300", "400", "500", "600", "700"],
  subsets: ["latin"],
  variable: "--font-am-body",
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
  return <span className="am-avatar-fallback">{getInitials(name)}</span>;
}

export function AbogadoMinimalTemplate({
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
      className={`${playfair.variable} ${inter.variable} am-minimal`}
      style={
        {
          "--c-primary": colorPrimary,
          "--c-accent": colorAccent,
          "--c-accent-lt": "#F7EFDA",
          "--c-bg": "#FFFFFF",
          "--c-bg2": "#FAFAFA",
          "--c-text": "#14171F",
          "--c-muted": "#767B85",
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
                {especialidadPrincipal && matriculaNumero ? " · " : ""}
                {matriculaNumero ? `Mat. Nº ${matriculaNumero}` : ""}
              </span>
              <h1>{name || "Tu nombre"}</h1>
              {heroTagline && <p className="am-lead">{heroTagline}</p>}
              <div className="am-hero-actions">
                {waLink && (
                  <a className="am-link-cta" href={waLink} target="_blank" rel="noopener">
                    {ctaText}
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
            <FadeInSection className="am-section-head">
              <h2>Áreas de práctica</h2>
            </FadeInSection>
            <div className="am-services-list">
              {services.map((s, i) => (
                <FadeInSection
                  key={`${s.titulo}-${i}`}
                  delayMs={Math.min(i, 5) * 60}
                  className="am-service-row"
                >
                  <span className="am-service-icon">{s.icono || "⚖️"}</span>
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

      <section className="am-section am-whyus" id="por-que-elegirnos">
        <div className="am-container">
          <FadeInSection className="am-section-head">
            <h2>Por qué elegirnos</h2>
          </FadeInSection>
          <div className="am-whyus-grid">
            {whyUs.map((item, i) => (
              <FadeInSection
                key={`${item.titulo}-${i}`}
                delayMs={Math.min(i, 5) * 60}
                className="am-whyus-item"
              >
                <span className="am-whyus-icon">{item.icono || "✓"}</span>
                <p>{item.titulo}</p>
              </FadeInSection>
            ))}
          </div>
        </div>
      </section>

      <section className="am-section" id="proceso">
        <div className="am-container">
          <FadeInSection className="am-section-head">
            <h2>Cómo trabajo</h2>
          </FadeInSection>
          <div className="am-process-grid">
            {PROCESO.map((step, i) => (
              <FadeInSection key={step.titulo} delayMs={i * 60} className="am-process-step">
                <span className="am-num am-uc">{`Paso ${String(i + 1).padStart(2, "0")}`}</span>
                <h3>{step.titulo}</h3>
                <p>{step.desc}</p>
              </FadeInSection>
            ))}
          </div>
        </div>
      </section>

      {showAbout && (
        <section className="am-section" id="sobre-mi">
          <div className="am-container">
            <FadeInSection className="am-section-head">
              <h2>Sobre {name || "Tu nombre"}</h2>
            </FadeInSection>
            <FadeInSection delayMs={60} className="am-about-copy">
              {formData.descripcion_corta && <p>{formData.descripcion_corta}</p>}
              <div className="am-credentials-list">
                {formData.anos_experiencia && (
                  <p className="am-credential-line">{formData.anos_experiencia} años de experiencia</p>
                )}
                {(formData.universidad || formData.año_graduacion) && (
                  <p className="am-credential-line">
                    {formData.universidad}
                    {formData.universidad && formData.año_graduacion ? " — " : ""}
                    {formData.año_graduacion}
                  </p>
                )}
                {matriculaNumero && (
                  <p className="am-credential-line">
                    Matrícula Nº {matriculaNumero}
                    {formData.matricula_colegio ? ` — ${formData.matricula_colegio}` : ""}
                  </p>
                )}
                {formData.asociacion_profesional && (
                  <p className="am-credential-line">{formData.asociacion_profesional}</p>
                )}
              </div>
            </FadeInSection>
          </div>
        </section>
      )}

      {testimonios.length > 0 && (
        <section className="am-section am-testimonials" id="testimonios">
          <div className="am-container">
            <FadeInSection className="am-section-head">
              <h2>Lo que dicen mis clientes</h2>
            </FadeInSection>
            <div className="am-testimonials-grid">
              {testimonios.map((t, i) => (
                <FadeInSection
                  key={`${t.nombre}-${i}`}
                  as="article"
                  delayMs={Math.min(i, 5) * 60}
                  className="am-testimonial-card"
                >
                  <p className="am-testimonial-quote">&ldquo;{t.texto}&rdquo;</p>
                  <div className="am-testimonial-author">
                    <span className="am-testimonial-name">{t.nombre}</span>
                    {t.cargo && <span className="am-testimonial-role">{t.cargo}</span>}
                  </div>
                </FadeInSection>
              ))}
            </div>
          </div>
        </section>
      )}

      <section className="am-section" id="faq">
        <div className="am-container">
          <FadeInSection className="am-section-head">
            <h2>Preguntas frecuentes</h2>
          </FadeInSection>
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
            {formData.horario_atencion && (
              <p className="am-cta-schedule">{formData.horario_atencion}</p>
            )}
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
            {matriculaNumero && (
              <>
                <span className="am-sep">·</span>
                {`Mat. Nº ${matriculaNumero}`}
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
            {isRealUrl(formData.instagram_url) && (
              <>
                <span className="am-sep">·</span>
                <a className="am-link-cta" href={formData.instagram_url} target="_blank" rel="noopener">
                  Instagram
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
          {formData.horario_atencion && (
            <p className="am-footer-disclaimer">{formData.horario_atencion}</p>
          )}
          <p className="am-footer-disclaimer">
            La información en este sitio no constituye asesoramiento legal. Consultá con un profesional para tu caso específico.
          </p>
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
.am-minimal h1, .am-minimal h2, .am-minimal h3{ margin:0; font-family: var(--font-am-display), serif; font-weight:600; }
.am-minimal p{ margin:0; overflow-wrap:anywhere; }
.am-minimal section{ min-width:0; }
.am-minimal svg{ flex-shrink:0; }
.am-minimal .am-container{ width:100%; max-width:1160px; margin-inline:auto; padding-inline:clamp(16px,4vw,32px); }
.am-minimal .am-uc{ text-transform:uppercase; letter-spacing:.12em; font-family: var(--font-am-body), sans-serif; }

.am-minimal .am-link-cta{
  display:inline-block; font-family: var(--font-am-body), sans-serif; font-weight:500; font-size:.95rem;
  border-bottom:1px solid var(--c-accent); padding-bottom:2px; transition:opacity .15s ease, border-color .15s ease;
}
.am-minimal .am-link-cta:hover{ opacity:.55; }

.am-minimal .am-avatar-fallback{
  display:flex; align-items:center; justify-content:center; width:100%; height:100%;
  background:var(--c-primary); color:#fff; font-weight:300;
}

.am-minimal .am-nav{ position:sticky; top:0; z-index:50; background:var(--c-bg); border-bottom:1px solid var(--c-border); }
.am-minimal .am-nav-inner{ display:flex; align-items:center; justify-content:space-between; padding-block:22px; }
.am-minimal .am-nav-name{ font-family: var(--font-am-display), serif; font-weight:600; font-size:1.15rem; letter-spacing:.02em; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
.am-minimal .am-nav-contact{ font-family: var(--font-am-body), sans-serif; font-weight:500; font-size:.9rem; flex-shrink:0; }
.am-minimal .am-nav-contact:hover{ opacity:.55; }

.am-minimal .am-hero{ padding-block:0; position:relative; }
.am-minimal .am-hero-grid{ display:grid; grid-template-columns:1.15fr .85fr; align-items:stretch; min-height:560px; }
.am-minimal .am-hero-copy{
  display:flex; flex-direction:column; justify-content:center; padding-block:56px; padding-right:56px;
  background: radial-gradient(760px 420px at 0% 0%, rgba(201,168,76,.08), transparent 60%);
}
.am-minimal .am-hero-eyebrow{ font-family: var(--font-am-body), sans-serif; font-size:.82rem; color:var(--c-muted); margin-bottom:20px; overflow-wrap:anywhere; }
.am-minimal .am-hero-copy h1{
  font-size:clamp(3rem,8vw,6.4rem); font-weight:600; line-height:.98; letter-spacing:-.01em;
  overflow-wrap:anywhere; margin-bottom:24px; color:var(--c-primary);
}
.am-minimal .am-lead{ font-family: var(--font-am-body), sans-serif; color:var(--c-muted); font-size:1.02rem; max-width:48ch; margin-bottom:30px; }
.am-minimal .am-hero-actions{ display:flex; flex-wrap:wrap; gap:24px; }
.am-minimal .am-hero-photo{ width:100%; height:100%; aspect-ratio:3/4; background:var(--c-bg2); overflow:hidden; box-shadow:-8px 0 32px rgba(20,23,31,.06); }
.am-minimal .am-hero-photo .am-avatar-fallback{ font-size:5rem; aspect-ratio:3/4; }
@media (max-width:860px){
  .am-minimal .am-hero-grid{ grid-template-columns:1fr; min-height:0; }
  .am-minimal .am-hero-copy{ padding-inline:0; order:2; padding-block:36px; }
  .am-minimal .am-hero-photo{ order:1; aspect-ratio:4/3; }
  .am-minimal .am-hero-photo .am-avatar-fallback{ aspect-ratio:4/3; }
}

.am-minimal .am-section{ padding-block:84px; }
.am-minimal .am-section-head{ margin-bottom:44px; }
.am-minimal .am-section-head h2{ font-size:1.7rem; font-weight:600; color:var(--c-primary); }
@media (max-width:600px){ .am-minimal .am-section{ padding-block:56px; } }

.am-minimal .am-services-list{ border-top:1px solid var(--c-border); }
.am-minimal .am-service-row{ display:grid; grid-template-columns:56px 1fr; gap:24px; align-items:flex-start; padding-block:28px; border-bottom:1px solid var(--c-border); transition:background-color .2s ease; }
.am-minimal .am-service-row:hover{ background:var(--c-bg2); }
.am-minimal .am-service-icon{ font-size:1.6rem; }
.am-minimal .am-service-row h3{ font-size:1.1rem; font-weight:600; margin-bottom:6px; }
.am-minimal .am-service-row p{ font-family: var(--font-am-body), sans-serif; color:var(--c-muted); font-size:.92rem; }
@media (max-width:600px){ .am-minimal .am-service-row{ grid-template-columns:40px 1fr; } }

.am-minimal .am-whyus-grid{ display:grid; grid-template-columns:repeat(4,1fr); gap:32px; }
.am-minimal .am-whyus-item{ display:flex; flex-direction:column; gap:14px; }
.am-minimal .am-whyus-icon{ font-size:1.6rem; }
.am-minimal .am-whyus-item p{ font-family: var(--font-am-body), sans-serif; font-size:.94rem; color:var(--c-text); }
@media (max-width:760px){ .am-minimal .am-whyus-grid{ grid-template-columns:1fr 1fr; } }
@media (max-width:480px){ .am-minimal .am-whyus-grid{ grid-template-columns:1fr; } }

.am-minimal .am-process-grid{ display:grid; grid-template-columns:repeat(4,1fr); gap:32px; }
.am-minimal .am-num{ display:block; font-family: var(--font-am-body), sans-serif; font-size:.75rem; color:var(--c-muted); margin-bottom:14px; }
.am-minimal .am-process-step h3{ font-size:1.1rem; font-weight:600; margin-bottom:8px; }
.am-minimal .am-process-step p{ font-family: var(--font-am-body), sans-serif; font-size:.9rem; color:var(--c-muted); }
@media (max-width:760px){ .am-minimal .am-process-grid{ grid-template-columns:1fr 1fr; } }
@media (max-width:480px){ .am-minimal .am-process-grid{ grid-template-columns:1fr; } }

.am-minimal .am-about-copy{ max-width:65ch; }
.am-minimal .am-about-copy p{ font-family: var(--font-am-body), sans-serif; font-size:1.05rem; color:var(--c-text); margin-bottom:18px; }
.am-minimal .am-credentials-list{ margin-top:36px; display:flex; flex-direction:column; gap:10px; }
.am-minimal .am-credential-line{ font-family: var(--font-am-body), sans-serif; font-size:.92rem; color:var(--c-muted); }
.am-minimal .am-credential-line::before{ content:"— "; color:var(--c-accent); }

.am-minimal .am-testimonials-grid{ display:grid; grid-template-columns:repeat(3,1fr); gap:24px; }
.am-minimal .am-testimonial-card{
  background:var(--c-bg2); border:1px solid var(--c-border); border-radius:12px; padding:32px 28px;
  box-shadow:0 8px 24px rgba(20,23,31,.05); display:flex; flex-direction:column; gap:18px;
  transition:transform .2s ease, box-shadow .2s ease;
}
.am-minimal .am-testimonial-card:hover{ transform:translateY(-4px); box-shadow:0 16px 32px rgba(20,23,31,.1); }
.am-minimal .am-testimonial-quote{ font-family: var(--font-am-display), serif; font-style:italic; font-size:1.05rem; color:var(--c-text); line-height:1.6; }
.am-minimal .am-testimonial-author{ display:flex; flex-direction:column; gap:2px; }
.am-minimal .am-testimonial-name{ font-family: var(--font-am-body), sans-serif; font-weight:600; font-size:.9rem; color:var(--c-primary); }
.am-minimal .am-testimonial-role{ font-family: var(--font-am-body), sans-serif; font-size:.82rem; color:var(--c-muted); }
@media (max-width:920px){ .am-minimal .am-testimonials-grid{ grid-template-columns:1fr 1fr; } }
@media (max-width:600px){ .am-minimal .am-testimonials-grid{ grid-template-columns:1fr; } }

.am-minimal .am-faq-list{ border-top:1px solid var(--c-border); }
.am-minimal .am-faq-item{ border-bottom:1px solid var(--c-border); }
.am-minimal .am-faq-item summary{
  list-style:none; display:flex; align-items:center; justify-content:space-between; gap:16px;
  padding-block:22px; font-family: var(--font-am-body), sans-serif; font-weight:500; font-size:1rem; cursor:pointer;
}
.am-minimal .am-faq-item summary::-webkit-details-marker{ display:none; }
.am-minimal .am-faq-toggle{ display:inline-block; font-size:1.1rem; font-weight:300; color:var(--c-muted); flex-shrink:0; transition:transform .15s ease; }
.am-minimal .am-faq-item[open] .am-faq-toggle{ transform:rotate(45deg); }
.am-minimal .am-faq-answer{ font-family: var(--font-am-body), sans-serif; color:var(--c-muted); font-size:.94rem; line-height:1.7; padding-bottom:22px; max-width:66ch; }

.am-minimal .am-cta{ text-align:center; padding-block:100px; }
.am-minimal .am-cta h2{ font-size:clamp(1.6rem,3.4vw,2.3rem); font-weight:600; color:var(--c-primary); margin-bottom:16px; }
.am-minimal .am-cta-schedule{ font-family: var(--font-am-body), sans-serif; font-size:.9rem; color:var(--c-muted); margin-bottom:28px; }
.am-minimal .am-cta-phone{
  display:inline-block; max-width:100%; overflow-wrap:anywhere;
  font-family: var(--font-am-display), serif; font-size:clamp(1.8rem,5vw,3rem); font-weight:600;
  border-bottom:1px solid var(--c-accent); padding-bottom:6px;
}
.am-minimal .am-cta-phone:hover{ opacity:.6; }

.am-minimal .am-footer{ border-top:1px solid var(--c-border); padding-block:32px; }
.am-minimal .am-footer-line{ font-family: var(--font-am-body), sans-serif; font-size:.86rem; color:var(--c-text); overflow-wrap:anywhere; }
.am-minimal .am-sep{ color:var(--c-border); margin-inline:10px; }
.am-minimal .am-footer-disclaimer{ font-family: var(--font-am-body), sans-serif; font-size:.76rem; color:var(--c-muted); margin-top:10px; max-width:70ch; }
@media (max-width:600px){ .am-minimal .am-footer-line{ line-height:1.9; } }
`;
