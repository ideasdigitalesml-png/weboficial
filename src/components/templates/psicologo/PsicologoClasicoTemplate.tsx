import { Playfair_Display, Inter } from "next/font/google";
import type { SectionConfigItem } from "@/lib/landings/update-landing";
import { buildWaLink } from "@/lib/whatsapp";
import { getInitials } from "@/lib/avatar-initials";
import { FadeInSection } from "@/components/templates/shared/FadeInSection";
import { FloatingWhatsappButton } from "@/components/templates/shared/FloatingWhatsappButton";
import type { PsicologoFormData } from "./PsicologoModernoTemplate";

// Same content rules as PsicologoModernoTemplate.tsx: "Cómo trabajo" is
// fixed generic copy (same category as the abogado templates' Proceso/FAQ),
// everything else renders the professional's own data with a plain
// hide-if-empty guard, and testimonios has no fallback (never fabricate
// patient quotes). Elegant/traditional, serif-forward variant -- soft
// serene blue, per the definitive per-variant palette in migration 0023.
const playfair = Playfair_Display({
  weight: ["400", "700"],
  style: ["normal", "italic"],
  subsets: ["latin"],
  variable: "--font-pc-display",
});
const inter = Inter({
  weight: ["400", "500", "600", "700"],
  subsets: ["latin"],
  variable: "--font-pc-body",
});

const DEFAULT_PRIMARY = "#5b6b8c";
const DEFAULT_ACCENT = "#5b6b8c";

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
  return <span className="pc-avatar-fallback">{getInitials(name)}</span>;
}

export function PsicologoClasicoTemplate({
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

  const name = formData.name || "";
  const waLink = formData.phone ? buildWaLink(formData.phone) : null;
  const year = new Date().getFullYear();
  const ctaText = formData.cta_text || "Reservá tu turno";
  const especialidades = formData.especialidades ?? [];
  const obrasSociales = formData.obras_sociales ?? [];
  const testimonios = formData.testimonios ?? [];
  const modalidadLabel = formData.modalidad
    ? MODALIDAD_LABELS[formData.modalidad] || formData.modalidad
    : "";
  const showModalidadBand = Boolean(modalidadLabel) || obrasSociales.length > 0;
  const heroLead = formData.enfoque_terapeutico
    ? `Enfoque terapéutico: ${formData.enfoque_terapeutico}`
    : "Un espacio de escucha y acompañamiento profesional.";

  return (
    <div
      className={`${playfair.variable} ${inter.variable} pc-clasico`}
      style={
        {
          "--c-primary": colorPrimary,
          "--c-accent": colorAccent,
          "--c-accent-lt": "#E9EDF4",
          "--c-bg": "#FFFFFF",
          "--c-bg2": "#F5F6FA",
          "--c-text": "#262B36",
          "--c-muted": "#666F80",
          "--c-border": "#DFE2EA",
        } as React.CSSProperties
      }
    >
      <style>{CSS}</style>

      <header className="pc-nav">
        <div className="pc-nav-rule" />
        <div className="pc-container pc-nav-inner">
          <a className="pc-nav-logo" href="#top">
            <strong>{name || "Tu nombre"}</strong>
            {formData.titulo_profesional && <span className="pc-uc">{formData.titulo_profesional}</span>}
          </a>
          <div className="pc-nav-row">
            {showServices && especialidades.length > 0 && (
              <a className="pc-uc" href="#especialidades">Especialidades</a>
            )}
            {showAbout && <a className="pc-uc" href="#sobre-mi">Sobre mí</a>}
            {showContact && <a className="pc-uc" href="#contacto">Contacto</a>}
            {waLink && (
              <a className="pc-btn pc-btn-outline" href={waLink} target="_blank" rel="noopener">
                {ctaText}
              </a>
            )}
          </div>
        </div>
        <div className="pc-nav-rule" />
      </header>

      {showHero && (
        <section className="pc-hero" id="top">
          <div className="pc-container">
            <div className="pc-hero-photo-wrap">
              <div className="pc-hero-photo">
                <Avatar name={name} photoUrl={formData.profile_image} />
              </div>
            </div>
            <div className="pc-hero-copy">
              <span className="pc-eyebrow pc-uc">
                {formData.titulo_profesional}
                {formData.titulo_profesional && formData.matricula_numero ? " · " : ""}
                {formData.matricula_numero ? `Mat. Nº ${formData.matricula_numero}` : ""}
              </span>
              <h1>{name || "Tu nombre"}</h1>
              <p className="pc-lead">{heroLead}</p>
              <div className="pc-hero-actions">
                {waLink && (
                  <a className="pc-btn pc-btn-primary" href={waLink} target="_blank" rel="noopener">
                    {ctaText}
                  </a>
                )}
                {showServices && especialidades.length > 0 && (
                  <a className="pc-btn pc-btn-outline" href="#especialidades">
                    Ver especialidades
                  </a>
                )}
              </div>
            </div>
          </div>
        </section>
      )}

      {showAbout && (
        <section className="pc-section" id="sobre-mi">
          <div className="pc-container">
            <FadeInSection className="pc-section-head">
              <span className="pc-eyebrow pc-uc">Trayectoria</span>
              <h2>Sobre {name || "Tu nombre"}</h2>
            </FadeInSection>
            {formData.descripcion && (
              <FadeInSection delayMs={60} className="pc-about-cols">
                <p className="pc-dropcap">{formData.descripcion}</p>
              </FadeInSection>
            )}
            <FadeInSection delayMs={120} className="pc-credentials-table">
              {formData.titulo_profesional && (
                <div className="pc-row">
                  <span className="pc-k pc-uc">Título</span>
                  <span className="pc-v">{formData.titulo_profesional}</span>
                </div>
              )}
              {formData.matricula_numero && (
                <div className="pc-row">
                  <span className="pc-k pc-uc">Matrícula</span>
                  <span className="pc-v">Nº {formData.matricula_numero}</span>
                </div>
              )}
              {formData.enfoque_terapeutico && (
                <div className="pc-row">
                  <span className="pc-k pc-uc">Enfoque</span>
                  <span className="pc-v">{formData.enfoque_terapeutico}</span>
                </div>
              )}
              {formData.horario_atencion && (
                <div className="pc-row">
                  <span className="pc-k pc-uc">Horario</span>
                  <span className="pc-v">{formData.horario_atencion}</span>
                </div>
              )}
            </FadeInSection>
          </div>
        </section>
      )}

      {showServices && especialidades.length > 0 && (
        <section className="pc-section pc-bg2" id="especialidades">
          <div className="pc-container">
            <FadeInSection className="pc-section-head">
              <span className="pc-eyebrow pc-uc">Especialidades</span>
              <h2>En qué puedo ayudarte</h2>
            </FadeInSection>
            <div className="pc-especialidades-list">
              {especialidades.map((item, i) => (
                <FadeInSection
                  key={`${item.titulo}-${i}`}
                  delayMs={Math.min(i, 5) * 70}
                  className="pc-especialidad-row"
                >
                  <span className="pc-especialidad-medallion">{item.icono || "🧠"}</span>
                  <div>
                    <h3>{item.titulo}</h3>
                    {item.descripcion && <p>{item.descripcion}</p>}
                  </div>
                </FadeInSection>
              ))}
            </div>
          </div>
        </section>
      )}

      {showModalidadBand && (
        <section className="pc-section" id="modalidad">
          <div className="pc-container">
            <FadeInSection className="pc-section-head">
              <span className="pc-eyebrow pc-uc">Información práctica</span>
              <h2>Modalidad y cobertura</h2>
            </FadeInSection>
            <div className="pc-modalidad-grid">
              {modalidadLabel && (
                <FadeInSection className="pc-modalidad-card">
                  <span className="pc-modalidad-icon">📍</span>
                  <p>{modalidadLabel}</p>
                </FadeInSection>
              )}
              {obrasSociales.length > 0 && (
                <FadeInSection delayMs={70} className="pc-obras-sociales">
                  <p className="pc-obras-sociales-label pc-uc">Obras sociales y prepagas</p>
                  <div className="pc-obras-sociales-pills">
                    {obrasSociales.map((item, i) => (
                      <span key={`${item.nombre}-${i}`} className="pc-pill">
                        {item.nombre}
                      </span>
                    ))}
                  </div>
                </FadeInSection>
              )}
            </div>
          </div>
        </section>
      )}

      <section className="pc-section pc-process" id="como-trabajo">
        <div className="pc-container">
          <FadeInSection className="pc-section-head">
            <span className="pc-eyebrow pc-uc">Metodología</span>
            <h2>Cómo trabajo</h2>
          </FadeInSection>
          <div className="pc-timeline">
            {COMO_TRABAJO.map((step, i) => (
              <FadeInSection key={step.titulo} delayMs={i * 70} className="pc-timeline-step">
                <span className="pc-timeline-marker">{i + 1}</span>
                <h3>{step.titulo}</h3>
                <p>{step.desc}</p>
              </FadeInSection>
            ))}
          </div>
        </div>
      </section>

      {testimonios.length > 0 && (
        <section className="pc-section pc-testimonials" id="testimonios">
          <div className="pc-container">
            <FadeInSection className="pc-section-head">
              <span className="pc-eyebrow pc-uc">Testimonios</span>
              <h2>Lo que dicen mis pacientes</h2>
            </FadeInSection>
            <div className="pc-testimonials-grid">
              {testimonios.map((t, i) => (
                <FadeInSection
                  key={`${t.nombre}-${i}`}
                  as="article"
                  delayMs={Math.min(i, 5) * 70}
                  className="pc-testimonial-card"
                >
                  <span className="pc-testimonial-mark">&ldquo;</span>
                  <p className="pc-testimonial-quote">{t.texto}</p>
                  <div className="pc-testimonial-author">
                    <span className="pc-testimonial-name">{t.nombre}</span>
                    {t.cargo && <span className="pc-testimonial-role">{t.cargo}</span>}
                  </div>
                </FadeInSection>
              ))}
            </div>
          </div>
        </section>
      )}

      {showContact && (
        <section className="pc-cta-banner" id="contacto">
          <div className="pc-container">
            <h2>¿Querés empezar un proceso terapéutico?</h2>
            <p>Escribime y coordinamos una consulta</p>
            {formData.horario_atencion && <p className="pc-cta-schedule">{formData.horario_atencion}</p>}
            {formData.precio_consulta && (
              <p className="pc-cta-schedule">Valor de la consulta: {formData.precio_consulta}</p>
            )}
            {waLink && (
              <a className="pc-btn pc-btn-ivory" href={waLink} target="_blank" rel="noopener">
                Escribime por WhatsApp
              </a>
            )}
          </div>
        </section>
      )}

      <footer className="pc-footer">
        <div className="pc-container">
          <svg className="pc-footer-seal" viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth="1">
            <circle cx="24" cy="24" r="21" />
            <circle cx="24" cy="24" r="16" />
            <path d="M24 8v4M24 36v4M8 24h4M36 24h4M12.9 12.9l2.8 2.8M32.3 32.3l2.8 2.8M12.9 35.1l2.8-2.8M32.3 15.7l2.8-2.8" />
          </svg>
          <p className="pc-footer-name">{name || "Tu nombre"}</p>
          {(formData.titulo_profesional || formData.matricula_numero) && (
            <p className="pc-footer-line">
              {formData.titulo_profesional}
              {formData.titulo_profesional ? <span className="pc-footer-sep">—</span> : null}
              {formData.matricula_numero ? `Mat. Nº ${formData.matricula_numero}` : ""}
            </p>
          )}
          <p className="pc-footer-line">
            {formData.email}
            {formData.email && formData.phone ? <span className="pc-footer-sep">—</span> : null}
            {formData.phone}
            {formData.direccion && (
              <>
                <span className="pc-footer-sep">—</span>
                {`Zona / consultorio: ${formData.direccion}`}
              </>
            )}
          </p>
          {formData.horario_atencion && <p className="pc-footer-line">{formData.horario_atencion}</p>}
          {(isRealUrl(formData.linkedin_url) || isRealUrl(formData.instagram_url)) && (
            <p className="pc-footer-line">
              {isRealUrl(formData.linkedin_url) && (
                <a href={formData.linkedin_url} target="_blank" rel="noopener">
                  LinkedIn
                </a>
              )}
              {isRealUrl(formData.linkedin_url) && isRealUrl(formData.instagram_url) && (
                <span className="pc-footer-sep">—</span>
              )}
              {isRealUrl(formData.instagram_url) && (
                <a href={formData.instagram_url} target="_blank" rel="noopener">
                  Instagram
                </a>
              )}
            </p>
          )}
          {subdomain && <p className="pc-footer-line">{`${subdomain}.weboficial.com.ar`}</p>}
          <p className="pc-footer-disclaimer">
            La información de este sitio tiene fines informativos y no reemplaza una consulta profesional. Ante una
            emergencia, comunicate con los servicios de emergencia de tu localidad.
          </p>
          <p className="pc-footer-bottom">{`© ${year} ${name || "Tu nombre"}. Todos los derechos reservados.`}</p>
        </div>
      </footer>

      <FloatingWhatsappButton
        phone={formData.phone}
        accentColor="var(--c-primary)"
        iconColor="#FFFFFF"
        desktopVisible={false}
      />
    </div>
  );
}

const CSS = `
.pc-clasico{
  font-family: var(--font-pc-body), Georgia, "Times New Roman", serif;
  color: var(--c-text);
  background: var(--c-bg);
  line-height: 1.7;
  overflow-x: hidden;
  scroll-behavior: smooth;
  -webkit-font-smoothing: antialiased;
}
.pc-clasico *, .pc-clasico *::before, .pc-clasico *::after{ box-sizing: border-box; }
.pc-clasico img{ max-width:100%; display:block; }
.pc-clasico a{ color:inherit; text-decoration:none; }
.pc-clasico h1, .pc-clasico h2, .pc-clasico h3{ margin:0; font-family: var(--font-pc-display), serif; font-weight:700; }
.pc-clasico p{ margin:0; overflow-wrap:anywhere; }
.pc-clasico section{ min-width:0; }
.pc-clasico svg{ flex-shrink:0; }
.pc-clasico .pc-container{ width:100%; max-width:1080px; margin-inline:auto; padding-inline:clamp(16px,4vw,32px); }
.pc-clasico .pc-uc{ text-transform:uppercase; letter-spacing:.08em; }
.pc-clasico .pc-bg2{ background:var(--c-bg2); }

.pc-clasico .pc-eyebrow{ display:inline-block; font-size:.76rem; font-weight:600; color:var(--c-primary); overflow-wrap:anywhere; }

.pc-clasico .pc-btn{
  display:inline-flex; align-items:center; justify-content:center; gap:10px;
  padding:14px 30px; border-radius:2px; font-weight:600; font-size:.86rem;
  border:1px solid var(--c-primary); cursor:pointer;
  transition:background-color .15s ease, color .15s ease, transform .15s ease, box-shadow .15s ease;
  white-space:nowrap;
}
.pc-clasico .pc-btn:hover{ transform:translateY(-2px); }
.pc-clasico .pc-btn-primary{ background:var(--c-primary); color:#fff; }
.pc-clasico .pc-btn-primary:hover{ box-shadow:0 12px 24px rgba(91,107,140,.24); }
.pc-clasico .pc-btn-outline{ background:transparent; color:var(--c-primary); }
.pc-clasico .pc-btn-outline:hover{ background:var(--c-primary); color:#fff; }
.pc-clasico .pc-btn-ivory{ background:transparent; color:#FFFFFF; border:1px solid #FFFFFF; }
.pc-clasico .pc-btn-ivory:hover{ background:#FFFFFF; color:var(--c-primary); }

.pc-clasico .pc-avatar-fallback{
  display:flex; align-items:center; justify-content:center; width:100%; height:100%;
  border-radius:50%; background:linear-gradient(135deg,var(--c-primary),#8b98b8);
  color:#fff; font-family: var(--font-pc-display), serif; font-weight:700;
}

.pc-clasico .pc-nav{ position:sticky; top:0; z-index:50; background:var(--c-bg); }
.pc-clasico .pc-nav-rule{ height:1px; background:var(--c-border); }
.pc-clasico .pc-nav-inner{ display:flex; flex-direction:column; align-items:center; gap:14px; padding-block:18px; text-align:center; }
.pc-clasico .pc-nav-logo strong{ display:block; font-family: var(--font-pc-display), serif; font-weight:700; font-size:1.3rem; color:var(--c-primary); }
.pc-clasico .pc-nav-logo span{ display:block; font-size:.78rem; color:var(--c-muted); margin-top:2px; }
.pc-clasico .pc-nav-row{ display:flex; align-items:center; gap:28px; font-size:.82rem; font-weight:600; color:var(--c-muted); }
.pc-clasico .pc-nav-row a:hover{ color:var(--c-primary); }
@media (max-width:760px){ .pc-clasico .pc-nav-row{ flex-wrap:wrap; justify-content:center; gap:16px 20px; } }

.pc-clasico .pc-hero{
  padding-block:72px 80px; text-align:center; position:relative;
  background:
    radial-gradient(900px 420px at 50% -18%, rgba(91,107,140,.12), transparent 62%),
    linear-gradient(180deg, var(--c-bg2) 0%, var(--c-bg) 65%);
}
.pc-clasico .pc-hero-photo-wrap{ width:220px; height:220px; margin-inline:auto; padding:6px; border:1px solid var(--c-primary); border-radius:50%; box-shadow:0 20px 44px rgba(91,107,140,.2); }
.pc-clasico .pc-hero-photo{ width:100%; height:100%; border-radius:50%; overflow:hidden; border:1px solid var(--c-primary); background:var(--c-bg2); }
.pc-clasico .pc-hero-photo .pc-avatar-fallback{ font-size:3.2rem; }
.pc-clasico .pc-hero-copy{ max-width:640px; margin-inline:auto; margin-top:30px; }
.pc-clasico .pc-hero-copy h1{ font-size:clamp(2rem,4.4vw,2.9rem); line-height:1.2; margin-block:14px 12px; color:var(--c-primary); overflow-wrap:anywhere; }
.pc-clasico .pc-lead{ color:var(--c-muted); font-size:1.05rem; margin-bottom:30px; }
.pc-clasico .pc-hero-actions{ display:flex; flex-wrap:wrap; justify-content:center; gap:14px; }

.pc-clasico .pc-section{ padding-block:80px; }
.pc-clasico .pc-section-head{ text-align:center; max-width:620px; margin:0 auto 48px; }
.pc-clasico .pc-section-head h2{ font-size:clamp(1.6rem,3.2vw,2.2rem); margin-top:10px; color:var(--c-primary); }
@media (max-width:600px){ .pc-clasico .pc-section{ padding-block:56px; } }

.pc-clasico .pc-about-cols{ display:flex; justify-content:center; max-width:760px; margin:0 auto; }
.pc-clasico .pc-about-cols p{ color:var(--c-text); font-size:1rem; }
.pc-clasico .pc-dropcap::first-letter{
  float:left; font-family: var(--font-pc-display), serif; font-weight:700; font-size:3.4rem;
  line-height:.85; color:var(--c-primary); padding-right:10px; padding-top:4px;
}
.pc-clasico .pc-credentials-table{ max-width:640px; margin:48px auto 0; border:1px solid var(--c-border); border-radius:10px; overflow:hidden; box-shadow:0 8px 24px rgba(38,43,54,.05); }
.pc-clasico .pc-row{ display:grid; grid-template-columns:180px 1fr; border-bottom:1px solid var(--c-border); }
.pc-clasico .pc-row:last-child{ border-bottom:none; }
.pc-clasico .pc-k{ padding:14px 18px; font-size:.78rem; font-weight:600; color:var(--c-muted); border-right:1px solid var(--c-border); background:var(--c-bg2); }
.pc-clasico .pc-v{ padding:14px 18px; font-size:.92rem; color:var(--c-text); }
@media (max-width:760px){
  .pc-clasico .pc-row{ grid-template-columns:140px 1fr; }
}

.pc-clasico .pc-especialidades-list{ max-width:760px; margin-inline:auto; display:flex; flex-direction:column; gap:18px; }
.pc-clasico .pc-especialidad-row{
  display:grid; grid-template-columns:64px 1fr; gap:22px; align-items:flex-start;
  padding:26px 26px; border:1px solid var(--c-border); border-radius:10px; background:var(--c-bg);
  box-shadow:0 8px 24px rgba(38,43,54,.05); transition:transform .2s ease, box-shadow .2s ease;
}
.pc-clasico .pc-especialidad-row:hover{ transform:translateY(-3px); box-shadow:0 16px 32px rgba(38,43,54,.1); }
.pc-clasico .pc-especialidad-medallion{
  display:flex; align-items:center; justify-content:center; width:56px; height:56px; border-radius:50%;
  border:1px solid var(--c-primary); background:var(--c-accent-lt); font-size:1.5rem;
}
.pc-clasico .pc-especialidad-row h3{ font-size:1.2rem; color:var(--c-text); margin-bottom:6px; }
.pc-clasico .pc-especialidad-row p{ color:var(--c-muted); font-size:.94rem; }
@media (max-width:600px){ .pc-clasico .pc-especialidad-row{ grid-template-columns:48px 1fr; padding:20px; } }

.pc-clasico .pc-modalidad-grid{ display:flex; flex-direction:column; align-items:center; gap:36px; }
.pc-clasico .pc-modalidad-card{
  display:flex; align-items:center; gap:14px; padding:18px 30px; border:1px solid var(--c-primary);
  border-radius:6px; background:var(--c-accent-lt); font-weight:600; color:var(--c-primary); font-size:1rem;
}
.pc-clasico .pc-modalidad-icon{ font-size:1.3rem; }
.pc-clasico .pc-obras-sociales{ text-align:center; max-width:760px; }
.pc-clasico .pc-obras-sociales-label{ font-size:.8rem; font-weight:600; color:var(--c-muted); margin-bottom:18px; }
.pc-clasico .pc-obras-sociales-pills{ display:flex; flex-wrap:wrap; justify-content:center; gap:12px; }
.pc-clasico .pc-pill{
  display:inline-flex; align-items:center; padding:9px 18px; border-radius:2px;
  border:1px solid var(--c-border); font-size:.88rem; color:var(--c-text); background:var(--c-bg);
}

.pc-clasico .pc-process{ background:var(--c-primary); color:#fff; }
.pc-clasico .pc-process .pc-section-head h2{ color:#fff; }
.pc-clasico .pc-process .pc-eyebrow{ color:#CBD4E6; }
.pc-clasico .pc-timeline{ position:relative; max-width:560px; margin-inline:auto; padding-left:52px; }
.pc-clasico .pc-timeline::before{ content:""; position:absolute; left:19px; top:6px; bottom:6px; width:1px; background:rgba(255,255,255,.32); }
.pc-clasico .pc-timeline-step{ position:relative; padding-bottom:40px; }
.pc-clasico .pc-timeline-step:last-child{ padding-bottom:0; }
.pc-clasico .pc-timeline-marker{
  position:absolute; left:-52px; top:0; width:40px; height:40px; border-radius:50%; border:1px solid #CBD4E6;
  display:flex; align-items:center; justify-content:center; font-family: var(--font-pc-display), serif; font-weight:700;
  color:#CBD4E6; background:var(--c-primary);
}
.pc-clasico .pc-timeline-step h3{ font-size:1.1rem; color:#fff; margin-bottom:6px; }
.pc-clasico .pc-timeline-step p{ color:rgba(255,255,255,.75); font-size:.92rem; }

.pc-clasico .pc-testimonials-grid{ display:grid; grid-template-columns:repeat(3,1fr); gap:24px; }
.pc-clasico .pc-testimonial-card{
  background:var(--c-bg2); border:1px solid var(--c-border); border-radius:10px; padding:34px 28px 28px;
  box-shadow:0 8px 24px rgba(38,43,54,.05); display:flex; flex-direction:column; gap:14px; text-align:center;
  transition:transform .2s ease, box-shadow .2s ease;
}
.pc-clasico .pc-testimonial-card:hover{ transform:translateY(-4px); box-shadow:0 16px 32px rgba(38,43,54,.1); }
.pc-clasico .pc-testimonial-mark{ font-family: var(--font-pc-display), serif; font-size:2.6rem; color:var(--c-primary); line-height:1; }
.pc-clasico .pc-testimonial-quote{ font-size:.98rem; color:var(--c-text); font-style:italic; line-height:1.7; }
.pc-clasico .pc-testimonial-author{ display:flex; flex-direction:column; gap:2px; margin-top:4px; }
.pc-clasico .pc-testimonial-name{ font-weight:700; color:var(--c-primary); font-size:.92rem; }
.pc-clasico .pc-testimonial-role{ font-size:.82rem; color:var(--c-muted); }
@media (max-width:920px){ .pc-clasico .pc-testimonials-grid{ grid-template-columns:1fr 1fr; } }
@media (max-width:600px){ .pc-clasico .pc-testimonials-grid{ grid-template-columns:1fr; } }

.pc-clasico .pc-cta-banner{ background:var(--c-primary); color:#fff; padding-block:68px; text-align:center; }
.pc-clasico .pc-cta-banner h2{ color:#fff; font-size:clamp(1.6rem,3.2vw,2.2rem); margin-bottom:12px; }
.pc-clasico .pc-cta-banner p{ color:rgba(255,255,255,.82); font-size:1rem; margin-bottom:12px; }
.pc-clasico .pc-cta-schedule{ font-size:.88rem; font-weight:600; color:#CBD4E6; margin-bottom:26px !important; }

.pc-clasico .pc-footer{ background:var(--c-bg2); border-top:1px solid var(--c-border); padding-block:44px 26px; text-align:center; }
.pc-clasico .pc-footer-seal{ width:56px; height:56px; margin:0 auto 16px; color:var(--c-primary); }
.pc-clasico .pc-footer-name{ font-family: var(--font-pc-display), serif; font-weight:700; font-size:1.15rem; color:var(--c-primary); }
.pc-clasico .pc-footer-line{ font-size:.86rem; color:var(--c-muted); margin-top:8px; overflow-wrap:anywhere; }
.pc-clasico .pc-footer-sep{ color:var(--c-primary); margin-inline:8px; }
.pc-clasico .pc-footer-disclaimer{ max-width:60ch; margin:22px auto 0; font-size:.76rem; color:var(--c-muted); line-height:1.6; }
.pc-clasico .pc-footer-bottom{ margin-top:14px; font-size:.76rem; color:var(--c-muted); }
`;
