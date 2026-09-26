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

// Sober/Linear-Stripe-inspired layout: small circular photo, oversized
// name, generous whitespace, no shadows/heavy borders, WhatsApp CTA as an
// underlined text link rather than a loud button. Same content rule as the
// rest of this directory: sections/fields with no data are omitted, not
// filled with placeholder copy. Playfair Display has no weight below 400,
// so the once-featherlight (300) hero heading now sits at 400 -- the spare
// feel comes from size/spacing/color instead of an ultralight cut.
const playfairDisplay = Playfair_Display({
  weight: ["400", "500", "600"],
  subsets: ["latin"],
  variable: "--font-cm-display",
});
const inter = Inter({
  weight: ["300", "400", "500", "600"],
  subsets: ["latin"],
  variable: "--font-cm-body",
});

// Definitive contador palette -- azul petróleo, not a picker. Minimal only
// exposes a single colorPrimary (used for the avatar fallback + CTA accents
// via var(--c-primary)); grays for muted text/backgrounds are fixed below.
const DEFAULT_PRIMARY = "#1B4F72";

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
  return <span className="cm-avatar-fallback">{getInitials(name)}</span>;
}

export function ContadorMinimalTemplate({
  formData,
  sectionsConfig,
  subdomain,
  colorPrimary = DEFAULT_PRIMARY,
}: {
  formData: ContadorFormData;
  sectionsConfig: SectionConfigItem[];
  subdomain?: string;
  colorPrimary?: string;
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
  const hasRedes = isRealUrl(formData.linkedin_url) || isRealUrl(formData.instagram_url);
  const whyUs =
    formData.por_que_elegirnos && formData.por_que_elegirnos.length > 0
      ? formData.por_que_elegirnos
      : DEFAULT_CONTADOR_WHY_US;
  const testimonios = formData.testimonios ?? [];

  return (
    <div
      className={`${playfairDisplay.variable} ${inter.variable} cm-minimal`}
      style={
        {
          "--c-primary": colorPrimary,
          "--c-bg": "#FFFFFF",
          "--c-bg2": "#F1F5F9",
          "--c-text": "#1C2B36",
          "--c-muted": "#64748B",
          "--c-border": "#E2E8F0",
        } as React.CSSProperties
      }
    >
      <style>{CSS}</style>

      <header className="cm-nav">
        <div className="cm-container cm-nav-inner">
          <Avatar name={name} photoUrl={formData.profile_image} />
          <span className="cm-nav-name">{name || "Tu nombre"}</span>
          <div className="cm-nav-links">
            {showServices && services.length > 0 && <a href="#servicios">Servicios</a>}
            {showAbout && <a href="#sobre-mi">Sobre mí</a>}
            {testimonios.length > 0 && <a href="#testimonios">Testimonios</a>}
            {showContact && <a href="#contacto">Contacto</a>}
          </div>
        </div>
      </header>

      {showHero && (
        <section className="cm-hero" id="top">
          <FadeInSection as="div" className="cm-container">
            <span className="cm-eyebrow">
              {tituloProfesional}
              {matricula ? ` · Mat. N° ${matricula}` : ""}
              {formData.zona ? ` · ${formData.zona}` : ""}
            </span>
            <h1>{name || "Tu nombre"}</h1>
            <p className="cm-lead">
              {formData.slogan ||
                formData.description ||
                "Contabilidad clara y a tiempo, sin vueltas ni sorpresas."}
            </p>
            <div className="cm-hero-actions">
              {waLink && (
                <a className="cm-link-cta" href={waLink} target="_blank" rel="noopener">
                  Contactame →
                </a>
              )}
              {showServices && services.length > 0 && (
                <a className="cm-link-cta cm-link-muted" href="#servicios">
                  Ver servicios
                </a>
              )}
            </div>
          </FadeInSection>
        </section>
      )}

      {showServices && services.length > 0 && (
        <section className="cm-section" id="servicios">
          <div className="cm-container">
            <FadeInSection as="div" className="cm-section-head">
              <h2>Servicios</h2>
            </FadeInSection>
            <div className="cm-services-list">
              {services.map((s, i) => (
                <FadeInSection
                  key={i}
                  as="div"
                  delayMs={i * 50}
                  className="cm-service-row"
                >
                  <span className="cm-service-num">
                    {s.icono || String(i + 1).padStart(2, "0")}
                  </span>
                  <h3>{s.titulo}</h3>
                  {s.descripcion && <p>{s.descripcion}</p>}
                </FadeInSection>
              ))}
            </div>
          </div>
        </section>
      )}

      {showAbout && (
        <section className="cm-section" id="sobre-mi">
          <FadeInSection as="div" className="cm-container cm-about-grid">
            <h2>Sobre {name || "Tu nombre"}</h2>
            <div>
              {formData.description && <p className="cm-about-text">{formData.description}</p>}
              <div className="cm-facts">
                {matricula && (
                  <p className="cm-fact">
                    Matrícula N° {matricula}
                    {formData.jurisdiccion ? ` — ${formData.jurisdiccion}` : ""}
                  </p>
                )}
                {formData.anos_experiencia && (
                  <p className="cm-fact">{formData.anos_experiencia} años de experiencia</p>
                )}
                {formData.cantidad_clientes && (
                  <p className="cm-fact">+{formData.cantidad_clientes} clientes atendidos</p>
                )}
                {formData.modalidad && (
                  <p className="cm-fact">{MODALIDAD_LABELS[formData.modalidad] ?? formData.modalidad}</p>
                )}
                {formData.especializacion && formData.especializacion.length > 0 && (
                  <p className="cm-fact">
                    {formData.especializacion
                      .map((v) => ESPECIALIZACION_LABELS[v] ?? v)
                      .join(" · ")}
                  </p>
                )}
                {formData.horario_atencion && (
                  <p className="cm-fact">{formData.horario_atencion}</p>
                )}
                {formData.direccion && (
                  <p className="cm-fact">{formData.direccion}</p>
                )}
              </div>
            </div>
          </FadeInSection>
        </section>
      )}

      <section className="cm-section" id="por-que-elegirme">
        <div className="cm-container">
          <FadeInSection as="div" className="cm-section-head">
            <h2>Por qué elegirme</h2>
          </FadeInSection>
          <div className="cm-why-list">
            {whyUs.map((item, i) => (
              <FadeInSection
                key={i}
                as="div"
                delayMs={i * 50}
                className="cm-why-row"
              >
                <span className="cm-why-icon">{item.icono}</span>
                <p>{item.titulo}</p>
              </FadeInSection>
            ))}
          </div>
        </div>
      </section>

      {testimonios.length > 0 && (
        <section className="cm-section" id="testimonios">
          <div className="cm-container">
            <FadeInSection as="div" className="cm-section-head">
              <h2>Lo que dicen mis clientes</h2>
            </FadeInSection>
            <div className="cm-testimonial-list">
              {testimonios.map((t, i) => (
                <FadeInSection
                  key={i}
                  as="div"
                  delayMs={i * 50}
                  className="cm-testimonial-row"
                >
                  <p className="cm-testimonial-text">&ldquo;{t.texto}&rdquo;</p>
                  <p className="cm-testimonial-name">
                    {t.nombre}
                    {t.cargo && <span className="cm-testimonial-role"> · {t.cargo}</span>}
                  </p>
                </FadeInSection>
              ))}
            </div>
          </div>
        </section>
      )}

      {showContact && waLink && (
        <section className="cm-cta" id="contacto">
          <FadeInSection as="div" className="cm-container">
            <h2>¿Hablamos de tus impuestos?</h2>
            <a className="cm-cta-phone" href={waLink} target="_blank" rel="noopener">
              {formData.phone}
            </a>
            {(formData.email || formData.zona || formData.direccion) && (
              <p className="cm-cta-extra">
                {[formData.email, formData.zona, formData.direccion]
                  .filter(Boolean)
                  .join(" · ")}
              </p>
            )}
          </FadeInSection>
        </section>
      )}

      <footer className="cm-footer">
        <div className="cm-container">
          <p className="cm-footer-line">
            {name || "Tu nombre"}
            {formData.email && (
              <>
                <span className="cm-sep">·</span>
                {formData.email}
              </>
            )}
            {formData.zona && (
              <>
                <span className="cm-sep">·</span>
                {formData.zona}
              </>
            )}
            <span className="cm-sep">·</span>
            {year}
          </p>
          {hasRedes && (
            <p className="cm-footer-line">
              <SocialLinks
                linkedinUrl={formData.linkedin_url}
                instagramUrl={formData.instagram_url}
                className="cm-link-cta"
              />
            </p>
          )}
          {subdomain && <p className="cm-footer-disclaimer">{`${subdomain}.weboficial.com.ar`}</p>}
        </div>
      </footer>

      <FloatingWhatsappButton phone={formData.phone} accentColor={colorPrimary} />
    </div>
  );
}

const CSS = `
.cm-minimal{
  font-family: var(--font-cm-body), -apple-system, BlinkMacSystemFont, sans-serif;
  font-weight:400;
  color: var(--c-text);
  background: var(--c-bg);
  line-height: 1.6;
  overflow-x: hidden;
  scroll-behavior: smooth;
  -webkit-font-smoothing: antialiased;
}
.cm-minimal *, .cm-minimal *::before, .cm-minimal *::after{ box-sizing: border-box; }
.cm-minimal img{ max-width:100%; display:block; }
.cm-minimal a{ color:inherit; text-decoration:none; }
.cm-minimal h1, .cm-minimal h2, .cm-minimal h3{ margin:0; font-family: var(--font-cm-display), serif; font-weight:500; letter-spacing:-.01em; }
.cm-minimal p{ margin:0; overflow-wrap:anywhere; }
.cm-minimal section{ min-width:0; }
.cm-minimal .cm-container{ width:100%; max-width:840px; margin-inline:auto; padding-inline:clamp(20px,5vw,32px); }

.cm-minimal .cm-link-cta{ display:inline-block; font-weight:500; font-size:.98rem; border-bottom:1px solid var(--c-text); padding-bottom:2px; transition:opacity .15s ease; }
.cm-minimal .cm-link-cta:hover{ opacity:.5; }
.cm-minimal .cm-link-muted{ color:var(--c-muted); border-color:var(--c-border); }

.cm-minimal .cm-avatar-fallback{ display:flex; align-items:center; justify-content:center; width:100%; height:100%; background:var(--c-primary); color:#fff; font-weight:300; font-size:.9rem; }

.cm-minimal .cm-nav{ position:sticky; top:0; z-index:50; background:rgba(255,255,255,.9); backdrop-filter:blur(8px); border-bottom:1px solid var(--c-border); }
.cm-minimal .cm-nav-inner{ display:flex; align-items:center; gap:12px; padding-block:16px; }
.cm-minimal .cm-nav-inner > .cm-avatar-fallback, .cm-minimal .cm-nav-inner img{ width:28px; height:28px; border-radius:50%; overflow:hidden; flex-shrink:0; }
.cm-minimal .cm-nav-name{ font-weight:500; font-size:.95rem; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; margin-right:auto; }
.cm-minimal .cm-nav-links{ display:flex; gap:22px; font-size:.86rem; color:var(--c-muted); }
.cm-minimal .cm-nav-links a:hover{ color:var(--c-text); }
@media (max-width:640px){ .cm-minimal .cm-nav-links{ display:none; } }

.cm-minimal .cm-hero{ padding-block:88px 72px; text-align:center; }
.cm-minimal .cm-eyebrow{ display:block; font-size:.85rem; color:var(--c-muted); margin-bottom:22px; overflow-wrap:anywhere; }
.cm-minimal .cm-hero h1{ font-size:clamp(2.6rem,7vw,5.2rem); font-weight:400; line-height:1.02; letter-spacing:-.02em; margin-bottom:24px; overflow-wrap:anywhere; }
.cm-minimal .cm-lead{ color:var(--c-muted); font-size:1.05rem; max-width:46ch; margin-inline:auto; margin-bottom:34px; }
.cm-minimal .cm-hero-actions{ display:flex; flex-wrap:wrap; justify-content:center; gap:28px; }

.cm-minimal .cm-section{ padding-block:64px; border-top:1px solid var(--c-border); }
.cm-minimal .cm-section-head{ margin-bottom:36px; }
.cm-minimal .cm-section-head h2{ font-size:1.3rem; font-weight:400; }
@media (max-width:600px){ .cm-minimal .cm-section{ padding-block:48px; } }

.cm-minimal .cm-services-list{ display:flex; flex-direction:column; }
.cm-minimal .cm-service-row{
  display:grid; grid-template-columns:44px 1fr; column-gap:20px; row-gap:4px; padding-block:20px 20px;
  padding-left:0; border-top:1px solid var(--c-border);
  transition:padding-left .18s ease, background-color .18s ease;
}
.cm-minimal .cm-service-row:first-child{ border-top:none; }
.cm-minimal .cm-service-row:hover{ padding-left:10px; background:var(--c-bg2); }
.cm-minimal .cm-service-num{ font-size:.82rem; color:var(--c-muted); padding-top:2px; }
.cm-minimal .cm-service-row h3{ font-size:1.02rem; font-weight:500; grid-column:2; }
.cm-minimal .cm-service-row p{ color:var(--c-muted); font-size:.9rem; grid-column:2; }
@media (max-width:480px){ .cm-minimal .cm-service-row{ grid-template-columns:28px 1fr; column-gap:12px; } }

.cm-minimal .cm-about-grid{ display:grid; grid-template-columns:1fr; gap:20px; }
.cm-minimal .cm-about-grid h2{ font-size:1.3rem; font-weight:400; }
.cm-minimal .cm-about-text{ font-size:1rem; color:var(--c-text); max-width:62ch; margin-bottom:20px; }
.cm-minimal .cm-facts{ display:flex; flex-direction:column; gap:8px; }
.cm-minimal .cm-fact{ font-size:.9rem; color:var(--c-muted); }
.cm-minimal .cm-fact::before{ content:"— "; color:var(--c-text); }

.cm-minimal .cm-why-list{ display:flex; flex-direction:column; }
.cm-minimal .cm-why-row{ display:grid; grid-template-columns:32px 1fr; column-gap:16px; align-items:center; padding-block:16px; border-top:1px solid var(--c-border); }
.cm-minimal .cm-why-row:first-child{ border-top:none; }
.cm-minimal .cm-why-icon{ font-size:1.3rem; }
.cm-minimal .cm-why-row p{ font-size:.96rem; color:var(--c-text); }

.cm-minimal .cm-testimonial-list{ display:grid; grid-template-columns:1fr 1fr; gap:32px; }
.cm-minimal .cm-testimonial-row{ padding:0; }
.cm-minimal .cm-testimonial-text{ font-size:1rem; color:var(--c-text); line-height:1.6; margin-bottom:12px; font-style:italic; }
.cm-minimal .cm-testimonial-name{ font-size:.86rem; color:var(--c-muted); font-weight:500; }
.cm-minimal .cm-testimonial-role{ font-weight:400; }
@media (max-width:640px){ .cm-minimal .cm-testimonial-list{ grid-template-columns:repeat(2,1fr); gap:20px; } }

.cm-minimal .cm-cta{ text-align:center; padding-block:96px; border-top:1px solid var(--c-border); }
.cm-minimal .cm-cta h2{ font-size:clamp(1.4rem,3vw,2rem); font-weight:400; margin-bottom:26px; }
.cm-minimal .cm-cta-phone{ display:inline-block; max-width:100%; overflow-wrap:anywhere; font-size:clamp(1.6rem,4.6vw,2.6rem); font-weight:400; border-bottom:1px solid var(--c-text); padding-bottom:6px; }
.cm-minimal .cm-cta-phone:hover{ opacity:.55; }
.cm-minimal .cm-cta-extra{ margin-top:20px; font-size:.88rem; color:var(--c-muted); overflow-wrap:anywhere; }

.cm-minimal .cm-footer{ padding-block:32px; border-top:1px solid var(--c-border); text-align:center; }
.cm-minimal .cm-footer-line{ font-size:.84rem; color:var(--c-muted); margin-top:8px; overflow-wrap:anywhere; }
.cm-minimal .cm-footer-line:first-child{ margin-top:0; }
.cm-minimal .cm-sep{ color:var(--c-border); margin-inline:8px; }
.cm-minimal .cm-footer-disclaimer{ font-size:.76rem; color:var(--c-muted); margin-top:10px; }
`;
