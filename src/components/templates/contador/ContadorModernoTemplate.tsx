import { Playfair_Display, Inter } from "next/font/google";
import type { SectionConfigItem } from "@/lib/landings/update-landing";
import {
  deriveContadorServiceEntries,
  DEFAULT_CONTADOR_WHY_US,
} from "@/lib/professions/contadores";
import { buildWaLink } from "@/lib/whatsapp";
import { getInitials } from "@/lib/avatar-initials";
import { FadeInSection } from "@/components/templates/shared/FadeInSection";
import { FloatingWhatsappButton } from "@/components/templates/shared/FloatingWhatsappButton";
import type { ContadorFormData } from "./ContadorLandingTemplate";

// Ported from templates/contador.html (design approved separately) into a
// server component that plugs into the real data model instead of
// {{mustache}} placeholders. Testimonios and "por qué elegirnos" render only
// when the professional has real data (see deriveContadorServiceEntries /
// DEFAULT_CONTADOR_WHY_US) -- fabricating stats/quotes is intentionally
// avoided, see the conversation this shipped in for that decision.
const playfairDisplay = Playfair_Display({
  weight: ["600", "700"],
  style: ["normal", "italic"],
  subsets: ["latin"],
  variable: "--font-cf-display",
});
const inter = Inter({
  weight: ["400", "500", "600", "700", "800"],
  subsets: ["latin"],
  variable: "--font-cf-body",
});

// Definitive contador palette (azul petróleo + white + gray) -- not a
// picker. Primary and accent share the same hue on purpose: this profession
// leans on tone/contrast/whitespace rather than a second bright accent
// color, per the redesign brief.
const DEFAULT_PRIMARY = "#1B4F72";
const DEFAULT_ACCENT = "#1B4F72";

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
  return <span className="cf-avatar-fallback">{getInitials(name)}</span>;
}

export function ContadorModernoTemplate({
  formData,
  sectionsConfig,
  subdomain,
  colorPrimary = DEFAULT_PRIMARY,
  colorAccent = DEFAULT_ACCENT,
  paletteVariables,
}: {
  formData: ContadorFormData;
  sectionsConfig: SectionConfigItem[];
  subdomain?: string;
  colorPrimary?: string;
  colorAccent?: string;
  // Full CSS variable override from a curated paleta (see
  // src/lib/templates/contador-paletas.ts). When present, replaces every
  // color variable below instead of just primary/accent -- a paleta also
  // picks the lighter/neutral tones (bg2, muted, border, etc.), which a
  // single accent color can't derive on its own.
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
  const services = deriveContadorServiceEntries(formData);
  const specialties = services.map((s) => s.titulo).filter(Boolean);
  const waLink = formData.phone ? buildWaLink(formData.phone) : null;
  const year = new Date().getFullYear();
  const tituloProfesional = formData.titulo_profesional || "Contador Público";
  const whyUs =
    formData.por_que_elegirnos && formData.por_que_elegirnos.length > 0
      ? formData.por_que_elegirnos
      : DEFAULT_CONTADOR_WHY_US;
  const testimonios = formData.testimonios ?? [];
  const hasRedes =
    isRealUrl(formData.linkedin_url) || isRealUrl(formData.instagram_url);

  return (
    <div
      className={`${playfairDisplay.variable} ${inter.variable} cf-moderno`}
      style={
        (paletteVariables ?? {
          "--c-primary": colorPrimary,
          "--c-accent": colorAccent,
          "--c-accent-lt": "#E6EDF2",
          "--c-bg": "#FFFFFF",
          "--c-bg2": "#F1F5F9",
          "--c-text": "#1C2B36",
          "--c-muted": "#64748B",
          "--c-border": "#E2E8F0",
        }) as React.CSSProperties
      }
    >
      <style>{CSS}</style>

      <header className="cf-nav">
        <div className="cf-container cf-nav-inner">
          <a className="cf-nav-logo" href="#top">
            <span className="cf-nav-logo-badge">
              <Avatar name={name} photoUrl={formData.profile_image} />
            </span>
            <span>{name || "Tu nombre"}</span>
          </a>
          <nav className="cf-nav-links" aria-label="Navegación principal">
            {showServices && services.length > 0 && (
              <a href="#servicios">Servicios</a>
            )}
            <a href="#proceso">Proceso</a>
            {showAbout && <a href="#perfil">Perfil</a>}
            {testimonios.length > 0 && <a href="#testimonios">Testimonios</a>}
            {showContact && <a href="#contacto">Contacto</a>}
          </nav>
          {waLink && (
            <div className="cf-nav-cta">
              <a
                className="cf-btn cf-btn-primary"
                href={waLink}
                target="_blank"
                rel="noopener"
              >
                Agendar consulta
              </a>
            </div>
          )}
        </div>
      </header>

      {showHero && (
        <section className="cf-hero" id="top">
          <FadeInSection as="div" className="cf-container cf-hero-grid">
            <div className="cf-hero-copy">
              <span className="cf-eyebrow">
                {tituloProfesional}
                {formData.zona ? ` · ${formData.zona}` : ""}
              </span>
              <h1>{name || "Tu nombre"}</h1>
              <p className="cf-lead">
                {formData.slogan ||
                  formData.description ||
                  "Asesoramiento impositivo y contable personalizado, pensado para que entiendas cada decisión antes de tomarla."}
              </p>
              <div className="cf-hero-actions">
                {waLink && (
                  <a
                    className="cf-btn cf-btn-primary"
                    href={waLink}
                    target="_blank"
                    rel="noopener"
                  >
                    {formData.cta_text || "Escribime por WhatsApp"}
                  </a>
                )}
                {showServices && services.length > 0 && (
                  <a className="cf-btn cf-btn-outline" href="#servicios">
                    Ver servicios
                  </a>
                )}
              </div>
            </div>
            <div className="cf-hero-visual">
              <div className="cf-photo-card">
                <span className="cf-hero-badge">Consulta sin costo</span>
                <Avatar name={name} photoUrl={formData.profile_image} />
              </div>
            </div>
          </FadeInSection>
        </section>
      )}

      {showHero && specialties.length > 0 && (
        <div className="cf-trust">
          <div className="cf-container cf-trust-inner">
            <span className="cf-trust-label">Especialista en:</span>
            <div className="cf-trust-items">
              {specialties.map((label) => (
                <span key={label} className="cf-trust-item">
                  {label}
                </span>
              ))}
            </div>
          </div>
        </div>
      )}

      {showServices && services.length > 0 && (
        <section className="cf-section" id="servicios">
          <div className="cf-container">
            <FadeInSection as="div" className="cf-section-head">
              <span className="cf-eyebrow">Servicios</span>
              <h2>En qué puedo ayudarte</h2>
              <p>
                Servicios pensados para cada etapa de tu actividad, desde el
                alta hasta el cierre de balance.
              </p>
            </FadeInSection>
            <div className="cf-services-grid">
              {services.map((s, i) => (
                <FadeInSection
                  key={i}
                  as="article"
                  delayMs={i * 60}
                  className="cf-service-card"
                >
                  {s.icono && <span className="cf-service-icon">{s.icono}</span>}
                  <h3>{s.titulo}</h3>
                  {s.descripcion && <p>{s.descripcion}</p>}
                </FadeInSection>
              ))}
            </div>
          </div>
        </section>
      )}

      <section className="cf-process" id="proceso">
        <div className="cf-container">
          <FadeInSection as="div" className="cf-section-head">
            <span className="cf-eyebrow">Proceso</span>
            <h2>Cómo trabajamos juntos</h2>
            <p>
              Un circuito simple, pensado para que siempre sepas en qué etapa
              está tu gestión.
            </p>
          </FadeInSection>
          <div className="cf-process-grid">
            <FadeInSection as="div" className="cf-process-step">
              <span className="cf-num">01</span>
              <h3>Contacto inicial</h3>
              <p>Me escribís por WhatsApp y coordinamos una consulta sin costo.</p>
            </FadeInSection>
            <FadeInSection as="div" delayMs={60} className="cf-process-step">
              <span className="cf-num">02</span>
              <h3>Diagnóstico</h3>
              <p>Revisamos tu situación impositiva y contable actual.</p>
            </FadeInSection>
            <FadeInSection as="div" delayMs={120} className="cf-process-step">
              <span className="cf-num">03</span>
              <h3>Propuesta</h3>
              <p>Te presento un plan de trabajo claro, con plazos y costos definidos.</p>
            </FadeInSection>
            <FadeInSection as="div" delayMs={180} className="cf-process-step">
              <span className="cf-num">04</span>
              <h3>Seguimiento</h3>
              <p>Acompañamiento continuo, con recordatorios de cada vencimiento.</p>
            </FadeInSection>
          </div>
        </div>
      </section>

      <section className="cf-section" id="por-que-elegirnos">
        <div className="cf-container">
          <FadeInSection as="div" className="cf-section-head">
            <span className="cf-eyebrow">Por qué elegirme</span>
            <h2>Lo que me diferencia</h2>
          </FadeInSection>
          <div className="cf-why-grid">
            {whyUs.map((item, i) => (
              <FadeInSection
                key={i}
                as="div"
                delayMs={i * 60}
                className="cf-why-item"
              >
                <span className="cf-why-icon">{item.icono}</span>
                <p>{item.titulo}</p>
              </FadeInSection>
            ))}
          </div>
        </div>
      </section>

      {showAbout && (
        <section className="cf-section cf-section-alt" id="perfil">
          <FadeInSection as="div" className="cf-container cf-profile-grid">
            <div className="cf-profile-photo">
              <Avatar name={name} photoUrl={formData.profile_image} />
            </div>
            <div>
              <h2 className="cf-profile-name">{name || "Tu nombre"}</h2>
              <p className="cf-profile-title">
                {tituloProfesional}
                {formData.zona ? ` · ${formData.zona}` : ""}
                {formData.modalidad
                  ? ` · ${MODALIDAD_LABELS[formData.modalidad] ?? formData.modalidad}`
                  : ""}
              </p>
              {formData.matricula && (
                <span className="cf-profile-matricula">
                  Matrícula N° {formData.matricula}
                  {formData.jurisdiccion ? ` — ${formData.jurisdiccion}` : ""}
                </span>
              )}
              {formData.description && (
                <p className="cf-profile-bio">{formData.description}</p>
              )}
              {(formData.anos_experiencia || formData.cantidad_clientes) && (
                <div className="cf-profile-stats">
                  {formData.anos_experiencia && (
                    <div>
                      <span className="cf-profile-stat-num">
                        {formData.anos_experiencia}
                      </span>
                      <span className="cf-profile-stat-label">
                        Años de experiencia
                      </span>
                    </div>
                  )}
                  {formData.cantidad_clientes && (
                    <div>
                      <span className="cf-profile-stat-num">
                        {formData.cantidad_clientes}
                      </span>
                      <span className="cf-profile-stat-label">
                        Clientes atendidos
                      </span>
                    </div>
                  )}
                </div>
              )}
            </div>
          </FadeInSection>
        </section>
      )}

      {testimonios.length > 0 && (
        <section className="cf-section" id="testimonios">
          <div className="cf-container">
            <FadeInSection as="div" className="cf-section-head">
              <span className="cf-eyebrow">Testimonios</span>
              <h2>Lo que dicen mis clientes</h2>
            </FadeInSection>
            <div className="cf-testimonial-grid">
              {testimonios.map((t, i) => (
                <FadeInSection
                  key={i}
                  as="article"
                  delayMs={i * 60}
                  className="cf-testimonial-card"
                >
                  <p className="cf-testimonial-text">&ldquo;{t.texto}&rdquo;</p>
                  <p className="cf-testimonial-name">{t.nombre}</p>
                  {t.cargo && <p className="cf-testimonial-role">{t.cargo}</p>}
                </FadeInSection>
              ))}
            </div>
          </div>
        </section>
      )}

      {showContact && (
        <section className="cf-section" id="contacto" style={{ paddingBlock: "0 88px" }}>
          <FadeInSection as="div" className="cf-cta-banner">
            <h2>¿Listo para ordenar tus cuentas?</h2>
            <p>
              Escribime y coordinamos una primera consulta sin costo para ver
              cómo puedo ayudarte.
            </p>
            {waLink && (
              <div className="cf-cta-actions">
                <a
                  className="cf-btn cf-btn-white"
                  href={waLink}
                  target="_blank"
                  rel="noopener"
                >
                  {formData.cta_text || "Escribime por WhatsApp"}
                </a>
              </div>
            )}
            <div className="cf-cta-contact">
              {formData.email && (
                <a href={`mailto:${formData.email}`}>{formData.email}</a>
              )}
              {waLink && (
                <a href={waLink} target="_blank" rel="noopener">
                  {formData.phone}
                </a>
              )}
              {formData.matricula && <span>Matrícula N° {formData.matricula}</span>}
              {formData.direccion && <span>{formData.direccion}</span>}
              {formData.horario_atencion && (
                <span>{formData.horario_atencion}</span>
              )}
              {hasRedes && (
                <span className="cf-cta-redes">
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
                </span>
              )}
            </div>
          </FadeInSection>
        </section>
      )}

      <footer className="cf-footer">
        <div className="cf-container">
          <div className="cf-footer-top">
            <div className="cf-footer-brand">
              <span className="cf-nav-logo-badge">
                <Avatar name={name} photoUrl={formData.profile_image} />
              </span>
              <span>{name || "Tu nombre"}</span>
            </div>
            {subdomain && (
              <span className="cf-footer-domain">{`${subdomain}.weboficial.com.ar`}</span>
            )}
          </div>
          <div className="cf-footer-bottom">
            <span>
              {tituloProfesional}
              {formData.matricula ? ` · Matrícula N° ${formData.matricula}` : ""}
            </span>
            <span>
              © {year} {name || "Tu nombre"}
            </span>
          </div>
        </div>
      </footer>

      <FloatingWhatsappButton
        phone={formData.phone}
        accentColor={colorAccent}
        desktopVisible={false}
      />
    </div>
  );
}

// All selectors scoped under .cf-moderno so this never leaks into (or gets
// overridden by) the rest of the app's global styles -- including
// Tailwind's own `.container` utility, which is why every class here is
// `cf-`-prefixed rather than reusing the generic names from the original
// static template.
const CSS = `
.cf-moderno{
  font-family: var(--font-cf-body), -apple-system, BlinkMacSystemFont, sans-serif;
  color: var(--c-text);
  background: var(--c-bg);
  line-height: 1.5;
  overflow-x: hidden;
  scroll-behavior: smooth;
  -webkit-font-smoothing: antialiased;
}
.cf-moderno *, .cf-moderno *::before, .cf-moderno *::after{ box-sizing: border-box; }
.cf-moderno img{ max-width:100%; display:block; }
.cf-moderno a{ color:inherit; text-decoration:none; }
.cf-moderno h1, .cf-moderno h2, .cf-moderno h3{
  margin:0;
  font-family: var(--font-cf-display), serif;
  font-weight:700;
  letter-spacing:-.01em;
}
.cf-moderno p{ margin:0; }
.cf-moderno section{ min-width:0; }
.cf-moderno .cf-container{ width:100%; max-width:1160px; margin-inline:auto; padding-inline:24px; }

.cf-moderno .cf-eyebrow{
  display:inline-flex; align-items:center; gap:8px;
  font-size:.8rem; font-weight:600; letter-spacing:.06em; text-transform:uppercase;
  color:var(--c-accent);
}
.cf-moderno .cf-eyebrow::before{
  content:""; width:8px; height:8px; border-radius:50%; background:var(--c-accent); flex-shrink:0;
}

.cf-moderno .cf-btn{
  display:inline-flex; align-items:center; justify-content:center; gap:10px;
  padding:14px 26px; border-radius:999px; font-weight:600; font-size:.95rem;
  border:1px solid transparent; cursor:pointer;
  transition:transform .15s ease, box-shadow .15s ease, background-color .15s ease;
  white-space:nowrap;
}
.cf-moderno .cf-btn:active{ transform:scale(.97); }
.cf-moderno .cf-btn-primary{ background:var(--c-accent); color:#fff; box-shadow:0 1px 2px rgba(16,21,28,.06); }
.cf-moderno .cf-btn-primary:hover{ box-shadow:0 8px 24px rgba(16,21,28,.08); }
.cf-moderno .cf-btn-outline{ background:transparent; border-color:var(--c-border); color:var(--c-text); }
.cf-moderno .cf-btn-outline:hover{ border-color:var(--c-primary); }
.cf-moderno .cf-btn-white{ background:#fff; color:var(--c-primary); }
.cf-moderno .cf-btn-white:hover{ box-shadow:0 8px 24px rgba(16,21,28,.08); }

.cf-moderno .cf-avatar-fallback{
  display:flex; align-items:center; justify-content:center;
  width:100%; height:100%;
  background:linear-gradient(135deg,var(--c-accent),var(--c-primary));
  color:#fff; font-family: var(--font-cf-display), serif; font-weight:400;
}

.cf-moderno .cf-nav{
  position:sticky; top:0; z-index:50;
  background:rgba(255,255,255,.72);
  backdrop-filter:blur(14px) saturate(160%);
  -webkit-backdrop-filter:blur(14px) saturate(160%);
  border-bottom:1px solid var(--c-border);
}
.cf-moderno .cf-nav-inner{ display:flex; align-items:center; justify-content:space-between; gap:16px; padding-block:14px; }
.cf-moderno .cf-nav-logo{ display:flex; align-items:center; gap:10px; font-weight:700; font-size:1.05rem; min-width:0; }
.cf-moderno .cf-nav-logo-badge{ width:34px; height:34px; border-radius:10px; overflow:hidden; flex-shrink:0; }
.cf-moderno .cf-nav-logo-badge .cf-avatar-fallback{ font-size:.85rem; border-radius:10px; }
.cf-moderno .cf-nav-logo span{ overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
.cf-moderno .cf-nav-links{ display:flex; align-items:center; gap:28px; font-size:.92rem; font-weight:500; color:var(--c-muted); }
.cf-moderno .cf-nav-links a:hover{ color:var(--c-text); }
.cf-moderno .cf-nav-cta{ flex-shrink:0; }
.cf-moderno .cf-nav-cta .cf-btn{ padding:11px 20px; font-size:.88rem; }
@media (max-width:860px){ .cf-moderno .cf-nav-links{ display:none; } }

.cf-moderno .cf-hero{ padding-block:64px 80px; background:linear-gradient(180deg,var(--c-accent-lt) 0%,var(--c-bg) 65%); }
.cf-moderno .cf-hero-grid{ display:grid; grid-template-columns:1.1fr .9fr; gap:56px; align-items:center; }
.cf-moderno .cf-hero-copy h1{ font-size:clamp(2.2rem,4.4vw,3.4rem); line-height:1.08; margin-block:18px 20px; color:var(--c-primary); }
.cf-moderno .cf-lead{ color:var(--c-muted); font-size:1.08rem; max-width:46ch; margin-bottom:32px; }
.cf-moderno .cf-hero-actions{ display:flex; flex-wrap:wrap; gap:14px; }
.cf-moderno .cf-hero-visual{ position:relative; }
.cf-moderno .cf-photo-card{
  position:relative; aspect-ratio:4/5; width:100%; border-radius:18px; overflow:hidden;
  box-shadow:0 24px 60px rgba(16,21,28,.14); background:var(--c-bg2); border:1px solid var(--c-border);
}
.cf-moderno .cf-photo-card .cf-avatar-fallback{ font-size:5rem; }
.cf-moderno .cf-hero-badge{
  position:absolute; top:20px; left:20px; display:inline-flex; align-items:center; gap:8px;
  background:rgba(255,255,255,.92); backdrop-filter:blur(6px); color:var(--c-primary);
  font-size:.82rem; font-weight:700; padding:9px 16px; border-radius:999px; box-shadow:0 1px 2px rgba(16,21,28,.06);
  z-index:1;
}
.cf-moderno .cf-hero-badge::before{
  content:"✓"; display:inline-flex; align-items:center; justify-content:center;
  width:16px; height:16px; border-radius:50%; background:var(--c-accent); color:#fff; font-size:.65rem;
}
@media (max-width:900px){
  .cf-moderno .cf-hero-grid{ grid-template-columns:1fr; gap:40px; }
  .cf-moderno .cf-hero-visual{ max-width:420px; margin-inline:auto; width:100%; }
}

.cf-moderno .cf-trust{ background:var(--c-bg2); border-block:1px solid var(--c-border); padding-block:22px; }
.cf-moderno .cf-trust-inner{ display:flex; flex-wrap:wrap; align-items:center; gap:14px; }
.cf-moderno .cf-trust-label{ font-size:.82rem; font-weight:600; color:var(--c-muted); flex-shrink:0; }
.cf-moderno .cf-trust-items{ display:flex; flex-wrap:wrap; gap:10px; min-width:0; }
.cf-moderno .cf-trust-item{
  font-size:.82rem; font-weight:600; color:var(--c-primary); background:#fff;
  border:1px solid var(--c-border); padding:7px 14px; border-radius:999px; white-space:nowrap;
}

.cf-moderno .cf-section{ padding-block:88px; }
.cf-moderno .cf-section-head{ max-width:640px; margin-bottom:48px; }
.cf-moderno .cf-section-head h2{ font-size:clamp(1.8rem,3.4vw,2.5rem); margin-top:14px; color:var(--c-primary); }
.cf-moderno .cf-section-head p{ color:var(--c-muted); margin-top:14px; font-size:1.02rem; }
.cf-moderno .cf-section-alt{ background:var(--c-bg2); }

.cf-moderno .cf-services-grid{ display:grid; grid-template-columns:repeat(3,1fr); gap:24px; }
.cf-moderno .cf-service-card{
  background:#fff; border:1px solid var(--c-border); border-radius:18px; padding:30px 26px;
  min-width:0; transition:transform .18s ease, box-shadow .18s ease;
}
.cf-moderno .cf-service-card:hover{ transform:translateY(-4px); box-shadow:0 8px 24px rgba(16,21,28,.08); }
.cf-moderno .cf-service-icon{
  width:52px; height:52px; border-radius:14px; display:flex; align-items:center; justify-content:center;
  background:var(--c-accent-lt); font-size:1.5rem; margin-bottom:18px;
}
.cf-moderno .cf-service-card h3{ font-family: var(--font-cf-body), sans-serif; font-weight:700; font-size:1.08rem; color:var(--c-text); margin-bottom:8px; }
.cf-moderno .cf-service-card p{ color:var(--c-muted); font-size:.94rem; }
@media (max-width:920px){ .cf-moderno .cf-services-grid{ grid-template-columns:repeat(2,1fr); } }
@media (max-width:600px){ .cf-moderno .cf-services-grid{ grid-template-columns:1fr; } }

.cf-moderno .cf-process{ background:var(--c-primary); color:#fff; padding-block:88px; }
.cf-moderno .cf-process .cf-section-head h2{ color:#fff; }
.cf-moderno .cf-process .cf-section-head p{ color:rgba(255,255,255,.68); }
.cf-moderno .cf-process .cf-eyebrow{ color:var(--c-accent-lt); }
.cf-moderno .cf-process .cf-eyebrow::before{ background:var(--c-accent-lt); }
.cf-moderno .cf-process-grid{ display:grid; grid-template-columns:repeat(4,1fr); gap:24px; }
.cf-moderno .cf-process-step{ min-width:0; padding:26px 22px; border-radius:16px; background:rgba(255,255,255,.06); border:1px solid rgba(255,255,255,.12); }
.cf-moderno .cf-num{ font-family: var(--font-cf-display), serif; font-size:2.2rem; color:var(--c-accent-lt); display:block; margin-bottom:10px; }
.cf-moderno .cf-process-step h3{ font-family: var(--font-cf-body), sans-serif; font-weight:700; font-size:1rem; margin-bottom:8px; }
.cf-moderno .cf-process-step p{ color:rgba(255,255,255,.68); font-size:.9rem; }
@media (max-width:920px){ .cf-moderno .cf-process-grid{ grid-template-columns:repeat(2,1fr); } }
@media (max-width:560px){ .cf-moderno .cf-process-grid{ grid-template-columns:1fr; } }

.cf-moderno .cf-profile-grid{ display:grid; grid-template-columns:.8fr 1.2fr; gap:56px; align-items:start; }
.cf-moderno .cf-profile-photo{ aspect-ratio:1/1; width:100%; border-radius:18px; overflow:hidden; border:1px solid var(--c-border); box-shadow:0 8px 24px rgba(16,21,28,.08); }
.cf-moderno .cf-profile-photo .cf-avatar-fallback{ font-size:4rem; }
.cf-moderno .cf-profile-name{ font-size:1.7rem; color:var(--c-primary); margin-bottom:6px; }
.cf-moderno .cf-profile-title{ color:var(--c-muted); font-weight:500; margin-bottom:4px; }
.cf-moderno .cf-profile-matricula{
  display:inline-block; font-size:.8rem; font-weight:600; color:var(--c-accent);
  background:var(--c-accent-lt); padding:6px 12px; border-radius:999px; margin-bottom:22px;
}
.cf-moderno .cf-profile-bio{ color:var(--c-text); font-size:1.02rem; line-height:1.7; margin-bottom:28px; max-width:60ch; overflow-wrap:break-word; }
.cf-moderno .cf-profile-stats{ display:flex; flex-wrap:wrap; gap:32px; }
.cf-moderno .cf-profile-stats > div{ display:flex; flex-direction:column; gap:2px; }
.cf-moderno .cf-profile-stat-num{ font-family: var(--font-cf-display), serif; font-weight:700; font-size:1.9rem; color:var(--c-primary); }
.cf-moderno .cf-profile-stat-label{ font-size:.82rem; color:var(--c-muted); }
@media (max-width:860px){
  .cf-moderno .cf-profile-grid{ grid-template-columns:1fr; }
  .cf-moderno .cf-profile-photo{ max-width:320px; margin-inline:auto; }
}

.cf-moderno .cf-why-grid{ display:grid; grid-template-columns:repeat(4,1fr); gap:20px; }
.cf-moderno .cf-why-item{
  display:flex; flex-direction:column; align-items:flex-start; gap:10px;
  padding:22px 20px; border-radius:16px; background:var(--c-bg2); border:1px solid var(--c-border);
}
.cf-moderno .cf-why-icon{ font-size:1.7rem; }
.cf-moderno .cf-why-item p{ font-weight:600; font-size:.96rem; color:var(--c-text); }
@media (max-width:920px){ .cf-moderno .cf-why-grid{ grid-template-columns:repeat(2,1fr); } }
@media (max-width:560px){ .cf-moderno .cf-why-grid{ grid-template-columns:1fr; } }

.cf-moderno .cf-testimonial-grid{ display:grid; grid-template-columns:repeat(3,1fr); gap:24px; }
.cf-moderno .cf-testimonial-card{
  background:#fff; border:1px solid var(--c-border); border-radius:18px; padding:28px 26px; min-width:0;
  box-shadow:0 8px 24px rgba(16,21,28,.06);
}
.cf-moderno .cf-testimonial-text{ color:var(--c-text); font-size:.98rem; line-height:1.6; margin-bottom:18px; font-style:italic; }
.cf-moderno .cf-testimonial-name{ font-weight:700; font-size:.94rem; color:var(--c-primary); }
.cf-moderno .cf-testimonial-role{ font-size:.84rem; color:var(--c-muted); margin-top:2px; }
@media (max-width:920px){ .cf-moderno .cf-testimonial-grid{ grid-template-columns:repeat(2,1fr); } }
@media (max-width:600px){ .cf-moderno .cf-testimonial-grid{ grid-template-columns:1fr; } }

.cf-moderno .cf-cta-banner{
  background:linear-gradient(120deg,var(--c-primary),var(--c-accent)); color:#fff;
  border-radius:28px; padding:56px 40px; text-align:center; margin-inline:24px;
}
.cf-moderno .cf-cta-banner h2{ color:#fff; font-size:clamp(1.8rem,3.6vw,2.6rem); margin-bottom:16px; }
.cf-moderno .cf-cta-banner p{ color:rgba(255,255,255,.82); font-size:1.02rem; max-width:52ch; margin-inline:auto; margin-bottom:32px; }
.cf-moderno .cf-cta-actions{ display:flex; flex-wrap:wrap; justify-content:center; gap:14px; margin-bottom:28px; }
.cf-moderno .cf-cta-contact{ display:flex; flex-wrap:wrap; justify-content:center; gap:24px; font-size:.9rem; color:rgba(255,255,255,.85); }
.cf-moderno .cf-cta-contact a:hover{ color:#fff; }
.cf-moderno .cf-cta-redes{ display:flex; gap:16px; }
@media (max-width:600px){ .cf-moderno .cf-cta-banner{ padding:44px 24px; margin-inline:16px; } }

.cf-moderno .cf-footer{ background:#0B0F14; color:rgba(255,255,255,.62); padding-block:48px 32px; margin-top:96px; }
.cf-moderno .cf-footer-top{
  display:flex; flex-wrap:wrap; justify-content:space-between; align-items:center; gap:20px;
  padding-bottom:28px; border-bottom:1px solid rgba(255,255,255,.1); margin-bottom:24px;
}
.cf-moderno .cf-footer-brand{ display:flex; align-items:center; gap:12px; color:#fff; font-weight:700; font-size:1.05rem; min-width:0; }
.cf-moderno .cf-footer-brand .cf-nav-logo-badge{ width:38px; height:38px; }
.cf-moderno .cf-footer-domain{ font-size:.86rem; color:rgba(255,255,255,.5); overflow-wrap:break-word; }
.cf-moderno .cf-footer-bottom{ display:flex; flex-wrap:wrap; justify-content:space-between; gap:12px; font-size:.8rem; color:rgba(255,255,255,.45); }
`;
