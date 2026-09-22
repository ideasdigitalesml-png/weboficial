import { Inter } from "next/font/google";
import type { SectionConfigItem } from "@/lib/landings/update-landing";
import { serviceEntries } from "@/lib/professions/contadores";
import { buildWaLink } from "@/lib/whatsapp";
import { getInitials } from "@/lib/avatar-initials";
import type { ContadorFormData } from "./ContadorLandingTemplate";

// Sober/Linear-Stripe-inspired layout: small circular photo, oversized
// name, generous whitespace, no shadows/heavy borders, WhatsApp CTA as an
// underlined text link rather than a loud button. Same content rule as the
// rest of this directory: sections/fields with no data are omitted, not
// filled with placeholder copy.
const inter = Inter({
  weight: ["300", "400", "500", "600"],
  subsets: ["latin"],
  variable: "--font-cm-body",
});

const DEFAULT_PRIMARY = "#111111";

const MODALIDAD_LABELS: Record<string, string> = {
  presencial: "Atención presencial",
  remoto: "Atención remota",
  ambos: "Atención presencial y remota",
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

  const name = formData.name || "";
  const services = serviceEntries(formData.servicios ?? []);
  const waLink = formData.phone ? buildWaLink(formData.phone) : null;
  const year = new Date().getFullYear();
  const tituloProfesional = formData.titulo_profesional || "Contador Público";
  const hasRedes = isRealUrl(formData.linkedin_url) || isRealUrl(formData.instagram_url);

  return (
    <div
      className={`${inter.variable} cm-minimal`}
      style={
        {
          "--c-primary": colorPrimary,
          "--c-bg": "#FFFFFF",
          "--c-bg2": "#FAFAFA",
          "--c-text": "#111111",
          "--c-muted": "#7A7A7A",
          "--c-border": "#EBEBEB",
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
            {showContact && <a href="#contacto">Contacto</a>}
          </div>
        </div>
      </header>

      {showHero && (
        <section className="cm-hero" id="top">
          <div className="cm-container">
            <span className="cm-eyebrow">
              {tituloProfesional}
              {formData.matricula ? ` · Mat. N° ${formData.matricula}` : ""}
              {formData.zona ? ` · ${formData.zona}` : ""}
            </span>
            <h1>{name || "Tu nombre"}</h1>
            <p className="cm-lead">
              {formData.slogan ||
                "Contabilidad clara y a tiempo, sin vueltas ni sorpresas."}
            </p>
            <div className="cm-hero-actions">
              {waLink && (
                <a className="cm-link-cta" href={waLink} target="_blank" rel="noopener">
                  Escribime por WhatsApp →
                </a>
              )}
              {showServices && services.length > 0 && (
                <a className="cm-link-cta cm-link-muted" href="#servicios">
                  Ver servicios
                </a>
              )}
            </div>
          </div>
        </section>
      )}

      {showServices && services.length > 0 && (
        <section className="cm-section" id="servicios">
          <div className="cm-container">
            <div className="cm-section-head">
              <h2>Servicios</h2>
            </div>
            <div className="cm-services-list">
              {services.map((s, i) => (
                <div key={s.value} className="cm-service-row">
                  <span className="cm-service-num">{String(i + 1).padStart(2, "0")}</span>
                  <h3>{s.label}</h3>
                  <p>{s.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {showAbout && (
        <section className="cm-section" id="sobre-mi">
          <div className="cm-container cm-about-grid">
            <h2>Sobre {name || "Tu nombre"}</h2>
            <div>
              {formData.description && <p className="cm-about-text">{formData.description}</p>}
              <div className="cm-facts">
                {formData.matricula && (
                  <p className="cm-fact">
                    Matrícula N° {formData.matricula}
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
                {formData.horario_atencion && (
                  <p className="cm-fact">{formData.horario_atencion}</p>
                )}
              </div>
            </div>
          </div>
        </section>
      )}

      {showContact && waLink && (
        <section className="cm-cta" id="contacto">
          <div className="cm-container">
            <h2>¿Hablamos de tus impuestos?</h2>
            <a className="cm-cta-phone" href={waLink} target="_blank" rel="noopener">
              {formData.phone}
            </a>
          </div>
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
              {isRealUrl(formData.linkedin_url) && (
                <a className="cm-link-cta" href={formData.linkedin_url} target="_blank" rel="noopener">
                  LinkedIn
                </a>
              )}
              {isRealUrl(formData.instagram_url) && (
                <>
                  {isRealUrl(formData.linkedin_url) && <span className="cm-sep">·</span>}
                  <a className="cm-link-cta" href={formData.instagram_url} target="_blank" rel="noopener">
                    Instagram
                  </a>
                </>
              )}
            </p>
          )}
          {subdomain && <p className="cm-footer-disclaimer">{`${subdomain}.weboficial.com.ar`}</p>}
        </div>
      </footer>
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
.cm-minimal h1, .cm-minimal h2, .cm-minimal h3{ margin:0; font-weight:500; letter-spacing:-.01em; }
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
.cm-minimal .cm-hero h1{ font-size:clamp(2.6rem,7vw,5.2rem); font-weight:300; line-height:1.02; letter-spacing:-.02em; margin-bottom:24px; overflow-wrap:anywhere; }
.cm-minimal .cm-lead{ color:var(--c-muted); font-size:1.05rem; max-width:46ch; margin-inline:auto; margin-bottom:34px; }
.cm-minimal .cm-hero-actions{ display:flex; flex-wrap:wrap; justify-content:center; gap:28px; }

.cm-minimal .cm-section{ padding-block:64px; border-top:1px solid var(--c-border); }
.cm-minimal .cm-section-head{ margin-bottom:36px; }
.cm-minimal .cm-section-head h2{ font-size:1.3rem; font-weight:400; }
@media (max-width:600px){ .cm-minimal .cm-section{ padding-block:48px; } }

.cm-minimal .cm-services-list{ display:flex; flex-direction:column; }
.cm-minimal .cm-service-row{ display:grid; grid-template-columns:44px 1fr; column-gap:20px; row-gap:4px; padding-block:20px; border-top:1px solid var(--c-border); }
.cm-minimal .cm-service-row:first-child{ border-top:none; }
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

.cm-minimal .cm-cta{ text-align:center; padding-block:96px; border-top:1px solid var(--c-border); }
.cm-minimal .cm-cta h2{ font-size:clamp(1.4rem,3vw,2rem); font-weight:300; margin-bottom:26px; }
.cm-minimal .cm-cta-phone{ display:inline-block; max-width:100%; overflow-wrap:anywhere; font-size:clamp(1.6rem,4.6vw,2.6rem); font-weight:300; border-bottom:1px solid var(--c-text); padding-bottom:6px; }
.cm-minimal .cm-cta-phone:hover{ opacity:.55; }

.cm-minimal .cm-footer{ padding-block:32px; border-top:1px solid var(--c-border); text-align:center; }
.cm-minimal .cm-footer-line{ font-size:.84rem; color:var(--c-muted); margin-top:8px; overflow-wrap:anywhere; }
.cm-minimal .cm-footer-line:first-child{ margin-top:0; }
.cm-minimal .cm-sep{ color:var(--c-border); margin-inline:8px; }
.cm-minimal .cm-footer-disclaimer{ font-size:.76rem; color:var(--c-muted); margin-top:10px; }
`;
