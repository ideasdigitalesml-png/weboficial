import { Playfair_Display, Inter } from "next/font/google";
import type { SectionConfigItem } from "@/lib/landings/update-landing";
import { buildWaLink } from "@/lib/whatsapp";
import { getInitials } from "@/lib/avatar-initials";
import { capitalizeName } from "@/lib/capitalize-name";
import { isValidMatricula } from "@/lib/is-valid-matricula";
import { FadeInSection } from "@/components/templates/shared/FadeInSection";
import { FloatingWhatsappButton } from "@/components/templates/shared/FloatingWhatsappButton";
import { SocialLinks } from "@/components/templates/shared/SocialLinks";
import {
  ENFOQUE_TERAPEUTICO_LABELS,
  POBLACION_ATENDIDA_LABELS,
  type PsicologoFormData,
} from "./PsicologoModernoTemplate";

// Same content rules as the other two psicologo templates: "Cómo trabajo"
// is fixed generic copy (same category as the abogado templates'
// Proceso/FAQ), everything else renders the professional's own data with a
// plain hide-if-empty guard, and testimonios has no fallback (never
// fabricate patient quotes). Spare/airy variant -- soft lavender, per the
// definitive per-variant palette in migration 0023.
const playfair = Playfair_Display({
  weight: ["400", "700"],
  style: ["normal", "italic"],
  subsets: ["latin"],
  variable: "--font-pm-display",
});
const inter = Inter({
  weight: ["300", "400", "500", "600", "700"],
  subsets: ["latin"],
  variable: "--font-pm-body",
});

const DEFAULT_PRIMARY = "#8b7d9e";
const DEFAULT_ACCENT = "#8b7d9e";

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
  return <span className="pm-avatar-fallback">{getInitials(name)}</span>;
}

export function PsicologoMinimalTemplate({
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
      className={`${playfair.variable} ${inter.variable} pm-minimal`}
      style={
        {
          "--c-primary": colorPrimary,
          "--c-accent": colorAccent,
          "--c-accent-lt": "#EEEAF3",
          "--c-bg": "#FFFFFF",
          "--c-bg2": "#FAF9FB",
          "--c-text": "#211F26",
          "--c-muted": "#767084",
          "--c-border": "#E9E6ED",
        } as React.CSSProperties
      }
    >
      <style>{CSS}</style>

      <header className="pm-nav">
        <div className="pm-container pm-nav-inner">
          <span className="pm-nav-name">{name || "Tu nombre"}</span>
          {showContact && <a className="pm-nav-contact" href="#contacto">Contacto</a>}
        </div>
      </header>

      {showHero && (
        <section className="pm-hero" id="top">
          <div className="pm-hero-grid">
            <div className="pm-hero-copy pm-container">
              <span className="pm-hero-eyebrow pm-uc">
                {formData.titulo_profesional}
                {formData.titulo_profesional && matriculaNumero ? " · " : ""}
                {matriculaNumero ? `Mat. Nº ${matriculaNumero}` : ""}
              </span>
              <h1>{name || "Tu nombre"}</h1>
              <p className="pm-lead">{heroLead}</p>
              <div className="pm-hero-actions">
                {waLink && (
                  <a className="pm-link-cta" href={waLink} target="_blank" rel="noopener">
                    {ctaText}
                  </a>
                )}
                {showServices && especialidades.length > 0 && (
                  <a className="pm-link-cta" href="#especialidades">
                    Ver especialidades
                  </a>
                )}
              </div>
            </div>
            <div className="pm-hero-photo">
              <Avatar name={name} photoUrl={formData.profile_image} />
            </div>
          </div>
        </section>
      )}

      {showServices && especialidades.length > 0 && (
        <section className="pm-section" id="especialidades">
          <div className="pm-container">
            <FadeInSection className="pm-section-head">
              <h2>En qué puedo ayudarte</h2>
            </FadeInSection>
            <div className="pm-especialidades-list">
              {especialidades.map((item, i) => (
                <FadeInSection
                  key={`${item.titulo}-${i}`}
                  delayMs={Math.min(i, 5) * 60}
                  className="pm-especialidad-row"
                >
                  <span className="pm-especialidad-icon">{item.icono || "🧠"}</span>
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
        <section className="pm-section pm-modalidad" id="modalidad">
          <div className="pm-container">
            <FadeInSection className="pm-section-head">
              <h2>Modalidad y cobertura</h2>
            </FadeInSection>
            <div className="pm-modalidad-body">
              {modalidadLabel && (
                <FadeInSection className="pm-modalidad-tag">{modalidadLabel}</FadeInSection>
              )}
              {poblacionAtendida.length > 0 && (
                <FadeInSection delayMs={30} className="pm-obras-sociales">
                  <p className="pm-obras-sociales-label pm-uc">Atiendo a</p>
                  <div className="pm-obras-sociales-pills">
                    {poblacionAtendida.map((value) => (
                      <span key={value} className="pm-pill">
                        {POBLACION_ATENDIDA_LABELS[value] ?? value}
                      </span>
                    ))}
                  </div>
                </FadeInSection>
              )}
              {obrasSocialesNombres.length > 0 && (
                <FadeInSection delayMs={60} className="pm-obras-sociales">
                  <p className="pm-obras-sociales-label pm-uc">Obras sociales y prepagas</p>
                  <div className="pm-obras-sociales-pills">
                    {obrasSocialesNombres.map((nombre, i) => (
                      <span key={`${nombre}-${i}`} className="pm-pill">
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

      <section className="pm-section" id="como-trabajo">
        <div className="pm-container">
          <FadeInSection className="pm-section-head">
            <h2>Cómo trabajo</h2>
          </FadeInSection>
          <div className="pm-process-grid">
            {COMO_TRABAJO.map((step, i) => (
              <FadeInSection key={step.titulo} delayMs={i * 60} className="pm-process-step">
                <span className="pm-num pm-uc">{`Paso ${String(i + 1).padStart(2, "0")}`}</span>
                <h3>{step.titulo}</h3>
                <p>{step.desc}</p>
              </FadeInSection>
            ))}
          </div>
        </div>
      </section>

      {showAbout && (
        <section className="pm-section" id="sobre-mi">
          <div className="pm-container">
            <FadeInSection className="pm-section-head">
              <h2>Sobre {name || "Tu nombre"}</h2>
            </FadeInSection>
            <FadeInSection delayMs={60} className="pm-about-copy">
              {formData.descripcion && <p>{formData.descripcion}</p>}
              {enfoqueLabel && (
                <p className="pm-enfoque">Enfoque terapéutico: {enfoqueLabel}</p>
              )}
              <div className="pm-credentials-list">
                {formData.titulo_profesional && (
                  <p className="pm-credential-line">{formData.titulo_profesional}</p>
                )}
                {matriculaNumero && (
                  <p className="pm-credential-line">Matrícula Nº {matriculaNumero}</p>
                )}
                {formData.horario_atencion && (
                  <p className="pm-credential-line">{formData.horario_atencion}</p>
                )}
              </div>
            </FadeInSection>
          </div>
        </section>
      )}

      {testimonios.length > 0 && (
        <section className="pm-section pm-testimonials" id="testimonios">
          <div className="pm-container">
            <FadeInSection className="pm-section-head">
              <h2>Lo que dicen mis pacientes</h2>
            </FadeInSection>
            <div className="pm-testimonials-grid">
              {testimonios.map((t, i) => (
                <FadeInSection
                  key={`${t.nombre}-${i}`}
                  as="article"
                  delayMs={Math.min(i, 5) * 60}
                  className="pm-testimonial-card"
                >
                  <p className="pm-testimonial-quote">&ldquo;{t.texto}&rdquo;</p>
                  <div className="pm-testimonial-author">
                    <span className="pm-testimonial-name">{t.nombre}</span>
                    {t.cargo && <span className="pm-testimonial-role">{t.cargo}</span>}
                  </div>
                </FadeInSection>
              ))}
            </div>
          </div>
        </section>
      )}

      {showContact && waLink && (
        <section className="pm-cta" id="contacto">
          <div className="pm-container">
            <h2>¿Querés empezar un proceso terapéutico?</h2>
            {formData.horario_atencion && <p className="pm-cta-schedule">{formData.horario_atencion}</p>}
            {formData.precio_consulta && (
              <p className="pm-cta-schedule">Valor de la consulta: {formData.precio_consulta}</p>
            )}
            <a className="pm-cta-phone" href={waLink} target="_blank" rel="noopener">
              {formData.phone}
            </a>
          </div>
        </section>
      )}

      <footer className="pm-footer">
        <div className="pm-container">
          <p className="pm-footer-line">
            {name || "Tu nombre"}
            {matriculaNumero && (
              <>
                <span className="pm-sep">·</span>
                {`Mat. Nº ${matriculaNumero}`}
              </>
            )}
            {formData.email && (
              <>
                <span className="pm-sep">·</span>
                {formData.email}
              </>
            )}
            <span className="pm-sep">·</span>
            {year}
            {(isRealUrl(formData.linkedin_url) || isRealUrl(formData.instagram_url)) && (
              <>
                <span className="pm-sep">·</span>
                <SocialLinks
                  linkedinUrl={formData.linkedin_url}
                  instagramUrl={formData.instagram_url}
                  className="pm-link-cta"
                  size={16}
                />
              </>
            )}
          </p>
          {subdomain && <p className="pm-footer-disclaimer">{`${subdomain}.weboficial.com.ar`}</p>}
          {formData.direccion && (
            <p className="pm-footer-disclaimer">{`Zona / consultorio: ${formData.direccion}`}</p>
          )}
          {formData.horario_atencion && (
            <p className="pm-footer-disclaimer">{formData.horario_atencion}</p>
          )}
          <p className="pm-footer-disclaimer">
            La información de este sitio tiene fines informativos y no reemplaza una consulta profesional. Ante una
            emergencia, comunicate con los servicios de emergencia de tu localidad.
          </p>
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
.pm-minimal{
  font-family: var(--font-pm-body), -apple-system, BlinkMacSystemFont, sans-serif;
  font-weight:400;
  color: var(--c-text);
  background: var(--c-bg);
  line-height: 1.6;
  overflow-x: hidden;
  scroll-behavior: smooth;
  -webkit-font-smoothing: antialiased;
}
.pm-minimal *, .pm-minimal *::before, .pm-minimal *::after{ box-sizing: border-box; }
.pm-minimal img{ max-width:100%; display:block; }
.pm-minimal a{ color:inherit; text-decoration:none; }
.pm-minimal h1, .pm-minimal h2, .pm-minimal h3{ margin:0; font-family: var(--font-pm-display), serif; font-weight:600; }
.pm-minimal p{ margin:0; overflow-wrap:anywhere; }
.pm-minimal section{ min-width:0; }
.pm-minimal svg{ flex-shrink:0; }
.pm-minimal .pm-container{ width:100%; max-width:1160px; margin-inline:auto; padding-inline:clamp(16px,4vw,32px); }
.pm-minimal .pm-uc{ text-transform:uppercase; letter-spacing:.12em; font-family: var(--font-pm-body), sans-serif; }

.pm-minimal .pm-link-cta{
  display:inline-block; font-family: var(--font-pm-body), sans-serif; font-weight:500; font-size:.95rem;
  border-bottom:1px solid var(--c-primary); padding-bottom:2px; transition:opacity .15s ease, border-color .15s ease;
}
.pm-minimal .pm-link-cta:hover{ opacity:.55; }

.pm-minimal .pm-avatar-fallback{
  display:flex; align-items:center; justify-content:center; width:100%; height:100%;
  background:var(--c-primary); color:#fff; font-weight:300;
}

.pm-minimal .pm-nav{ position:sticky; top:0; z-index:50; background:var(--c-bg); border-bottom:1px solid var(--c-border); }
.pm-minimal .pm-nav-inner{ display:flex; align-items:center; justify-content:space-between; padding-block:22px; }
.pm-minimal .pm-nav-name{ font-family: var(--font-pm-display), serif; font-weight:600; font-size:1.15rem; letter-spacing:.02em; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
.pm-minimal .pm-nav-contact{ font-family: var(--font-pm-body), sans-serif; font-weight:500; font-size:.9rem; flex-shrink:0; }
.pm-minimal .pm-nav-contact:hover{ opacity:.55; }

.pm-minimal .pm-hero{ padding-block:0; position:relative; }
.pm-minimal .pm-hero-grid{ display:grid; grid-template-columns:1.15fr .85fr; align-items:stretch; min-height:560px; }
.pm-minimal .pm-hero-copy{
  display:flex; flex-direction:column; justify-content:center; padding-block:56px; padding-right:56px;
  background: radial-gradient(760px 420px at 0% 0%, rgba(139,125,158,.09), transparent 60%);
}
.pm-minimal .pm-hero-eyebrow{ font-family: var(--font-pm-body), sans-serif; font-size:.82rem; color:var(--c-muted); margin-bottom:20px; overflow-wrap:anywhere; }
.pm-minimal .pm-hero-copy h1{
  font-size:clamp(3rem,8vw,6.4rem); font-weight:600; line-height:.98; letter-spacing:-.01em;
  overflow-wrap:anywhere; margin-bottom:24px; color:var(--c-primary);
}
.pm-minimal .pm-lead{ font-family: var(--font-pm-body), sans-serif; color:var(--c-muted); font-size:1.02rem; max-width:48ch; margin-bottom:30px; }
.pm-minimal .pm-hero-actions{ display:flex; flex-wrap:wrap; gap:24px; }
.pm-minimal .pm-hero-photo{ width:100%; height:100%; aspect-ratio:3/4; background:var(--c-bg2); overflow:hidden; box-shadow:-8px 0 32px rgba(33,31,38,.06); }
.pm-minimal .pm-hero-photo .pm-avatar-fallback{ font-size:5rem; aspect-ratio:3/4; }
@media (max-width:860px){
  .pm-minimal .pm-hero-grid{ grid-template-columns:1fr; min-height:0; }
  .pm-minimal .pm-hero-copy{ padding-inline:0; order:2; padding-block:36px; }
  .pm-minimal .pm-hero-photo{ order:1; aspect-ratio:4/3; }
  .pm-minimal .pm-hero-photo .pm-avatar-fallback{ aspect-ratio:4/3; }
}

.pm-minimal .pm-section{ padding-block:84px; }
.pm-minimal .pm-section-head{ margin-bottom:44px; }
.pm-minimal .pm-section-head h2{ font-size:1.7rem; font-weight:600; color:var(--c-primary); }
@media (max-width:600px){ .pm-minimal .pm-section{ padding-block:56px; } }

.pm-minimal .pm-especialidades-list{ border-top:1px solid var(--c-border); }
.pm-minimal .pm-especialidad-row{ display:grid; grid-template-columns:56px 1fr; gap:24px; align-items:flex-start; padding-block:28px; border-bottom:1px solid var(--c-border); transition:background-color .2s ease; }
.pm-minimal .pm-especialidad-row:hover{ background:var(--c-bg2); }
.pm-minimal .pm-especialidad-icon{ font-size:1.6rem; }
.pm-minimal .pm-especialidad-row h3{ font-size:1.1rem; font-weight:600; margin-bottom:6px; }
.pm-minimal .pm-especialidad-row p{ font-family: var(--font-pm-body), sans-serif; color:var(--c-muted); font-size:.92rem; }
@media (max-width:600px){ .pm-minimal .pm-especialidad-row{ grid-template-columns:40px 1fr; } }

.pm-minimal .pm-modalidad{ background:var(--c-bg2); }
.pm-minimal .pm-modalidad-body{ display:flex; flex-direction:column; align-items:center; gap:32px; text-align:center; }
.pm-minimal .pm-modalidad-tag{
  font-family: var(--font-pm-display), serif; font-size:1.4rem; font-weight:600; color:var(--c-primary);
}
.pm-minimal .pm-obras-sociales-label{ font-size:.78rem; color:var(--c-muted); margin-bottom:16px; }
.pm-minimal .pm-obras-sociales-pills{ display:flex; flex-wrap:wrap; justify-content:center; gap:10px; }
.pm-minimal .pm-pill{
  display:inline-flex; align-items:center; padding:8px 16px; border:1px solid var(--c-border);
  font-family: var(--font-pm-body), sans-serif; font-size:.86rem; color:var(--c-text); background:var(--c-bg);
}

.pm-minimal .pm-process-grid{ display:grid; grid-template-columns:repeat(3,1fr); gap:32px; }
.pm-minimal .pm-num{ display:block; font-family: var(--font-pm-body), sans-serif; font-size:.75rem; color:var(--c-muted); margin-bottom:14px; }
.pm-minimal .pm-process-step h3{ font-size:1.1rem; font-weight:600; margin-bottom:8px; }
.pm-minimal .pm-process-step p{ font-family: var(--font-pm-body), sans-serif; font-size:.9rem; color:var(--c-muted); }
@media (max-width:760px){ .pm-minimal .pm-process-grid{ grid-template-columns:1fr 1fr; } }
@media (max-width:480px){ .pm-minimal .pm-process-grid{ grid-template-columns:repeat(2,1fr); gap:16px; } }

.pm-minimal .pm-about-copy{ max-width:65ch; }
.pm-minimal .pm-about-copy p{ font-family: var(--font-pm-body), sans-serif; font-size:1.05rem; color:var(--c-text); margin-bottom:18px; }
.pm-minimal .pm-about-copy .pm-enfoque{ font-weight:600; color:var(--c-primary); }
.pm-minimal .pm-credentials-list{ margin-top:36px; display:flex; flex-direction:column; gap:10px; }
.pm-minimal .pm-credential-line{ font-family: var(--font-pm-body), sans-serif; font-size:.92rem; color:var(--c-muted); }
.pm-minimal .pm-credential-line::before{ content:"— "; color:var(--c-primary); }

.pm-minimal .pm-testimonials-grid{ display:grid; grid-template-columns:repeat(3,1fr); gap:24px; }
.pm-minimal .pm-testimonial-card{
  background:var(--c-bg2); border:1px solid var(--c-border); border-radius:12px; padding:32px 28px;
  box-shadow:0 8px 24px rgba(33,31,38,.05); display:flex; flex-direction:column; gap:18px;
  transition:transform .2s ease, box-shadow .2s ease;
}
.pm-minimal .pm-testimonial-card:hover{ transform:translateY(-4px); box-shadow:0 16px 32px rgba(33,31,38,.1); }
.pm-minimal .pm-testimonial-quote{ font-family: var(--font-pm-display), serif; font-style:italic; font-size:1.05rem; color:var(--c-text); line-height:1.6; }
.pm-minimal .pm-testimonial-author{ display:flex; flex-direction:column; gap:2px; }
.pm-minimal .pm-testimonial-name{ font-family: var(--font-pm-body), sans-serif; font-weight:600; font-size:.9rem; color:var(--c-primary); }
.pm-minimal .pm-testimonial-role{ font-family: var(--font-pm-body), sans-serif; font-size:.82rem; color:var(--c-muted); }
@media (max-width:920px){ .pm-minimal .pm-testimonials-grid{ grid-template-columns:1fr 1fr; } }
@media (max-width:600px){ .pm-minimal .pm-testimonials-grid{ grid-template-columns:repeat(2,1fr); gap:16px; } }

.pm-minimal .pm-cta{ text-align:center; padding-block:100px; }
.pm-minimal .pm-cta h2{ font-size:clamp(1.6rem,3.4vw,2.3rem); font-weight:600; color:var(--c-primary); margin-bottom:16px; }
.pm-minimal .pm-cta-schedule{ font-family: var(--font-pm-body), sans-serif; font-size:.9rem; color:var(--c-muted); margin-bottom:10px; }
.pm-minimal .pm-cta-schedule + .pm-cta-schedule{ margin-bottom:28px; }
.pm-minimal .pm-cta-phone{
  display:inline-block; max-width:100%; overflow-wrap:anywhere; margin-top:18px;
  font-family: var(--font-pm-display), serif; font-size:clamp(1.8rem,5vw,3rem); font-weight:600;
  border-bottom:1px solid var(--c-primary); padding-bottom:6px;
}
.pm-minimal .pm-cta-phone:hover{ opacity:.6; }

.pm-minimal .pm-footer{ border-top:1px solid var(--c-border); padding-block:32px; }
.pm-minimal .pm-footer-line{ font-family: var(--font-pm-body), sans-serif; font-size:.86rem; color:var(--c-text); overflow-wrap:anywhere; }
.pm-minimal .pm-sep{ color:var(--c-border); margin-inline:10px; }
.pm-minimal .pm-footer-disclaimer{ font-family: var(--font-pm-body), sans-serif; font-size:.76rem; color:var(--c-muted); margin-top:10px; max-width:70ch; }
@media (max-width:600px){ .pm-minimal .pm-footer-line{ line-height:1.9; } }
`;
