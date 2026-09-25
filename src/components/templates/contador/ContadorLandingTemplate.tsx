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

// This is the contador's own client-facing page -- deliberately not styled
// with weboficial's navy/sky brand tokens (globals.css). The palette lives
// entirely in the --cf-* CSS variables below so it stays independent of the
// platform's own branding and can vary per template later.
const MODALIDAD_LABELS: Record<string, string> = {
  presencial: "Atención presencial",
  remoto: "Atención remota",
  ambos: "Atención presencial y remota",
};

// Legacy/fallback template -- simpler structure than the other three, but
// gets the same premium palette/typography/field treatment. No embedded CSS
// block here, so fonts are applied via next/font's generated `.className`
// directly on the elements that need them, scoped to this file only.
const playfairDisplay = Playfair_Display({
  subsets: ["latin"],
  weight: ["600", "700"],
  variable: "--font-cf-display",
});
const interFont = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-cf-body",
});

export interface RepeaterItem {
  [key: string]: string;
}

export interface ContadorFormData {
  name?: string;
  matricula?: string;
  jurisdiccion?: string;
  profile_image?: string;
  phone?: string;
  email?: string;
  zona?: string;
  modalidad?: string;
  servicios?: string[];
  description?: string;
  // Added for the Clásico/Minimal templates -- Moderno predates these and
  // doesn't render them, but they live on the same shared form_schema/type
  // so every contador template can opt into whichever it has data for.
  // As of migration 0018 these are all actually part of form_schema (they
  // previously weren't, despite being declared here -- see that migration).
  titulo_profesional?: string;
  anos_experiencia?: string;
  cantidad_clientes?: string;
  linkedin_url?: string;
  instagram_url?: string;
  horario_atencion?: string;
  slogan?: string;
  // Added for the premium redesign -- see migration 0018 and
  // src/lib/professions/contadores.ts (deriveContadorServiceEntries) for the
  // fallback used when servicios_detallados is empty (existing landings
  // created before this field existed).
  direccion?: string;
  cta_text?: string;
  servicios_detallados?: RepeaterItem[];
  por_que_elegirnos?: RepeaterItem[];
  testimonios?: RepeaterItem[];
}

function isRealUrl(value?: string): value is string {
  return Boolean(value && value !== "#");
}

// Default accent is the definitive contador palette's azul petróleo -- see
// the redesign notes in the Moderno/Clásico/Minimal templates. This is now a
// fixed brand color for the profession (paired with white + gray), not a
// picker; the accentColor prop still exists for curated-palette overrides.
const DEFAULT_ACCENT = "#1B4F72";

export function ContadorLandingTemplate({
  formData,
  sectionsConfig,
  accentColor = DEFAULT_ACCENT,
}: {
  formData: ContadorFormData;
  sectionsConfig: SectionConfigItem[];
  accentColor?: string;
}) {
  const sections = [...sectionsConfig]
    .filter((s) => s.visible && SECTIONS[s.id])
    .sort((a, b) => a.order - b.order);

  const whyUs =
    formData.por_que_elegirnos && formData.por_que_elegirnos.length > 0
      ? formData.por_que_elegirnos
      : DEFAULT_CONTADOR_WHY_US;
  const testimonios = formData.testimonios ?? [];
  const hasRedes =
    isRealUrl(formData.linkedin_url) || isRealUrl(formData.instagram_url);

  return (
    <div
      style={
        {
          "--cf-ink": "#1C2B36",
          "--cf-body": "#64748B",
          "--cf-surface": "#FFFFFF",
          "--cf-surface-muted": "#F1F5F9",
          "--cf-border": "#E2E8F0",
          "--cf-accent": accentColor,
          "--cf-accent-dark": `color-mix(in srgb, ${accentColor} 80%, black)`,
          "--cf-accent-soft": `color-mix(in srgb, ${accentColor} 10%, white)`,
        } as React.CSSProperties
      }
      className={`${interFont.className} flex min-h-full flex-col bg-[var(--cf-surface)] text-[var(--cf-ink)]`}
    >
      {sections.map((section) => (
        <div key={section.id}>{SECTIONS[section.id](formData)}</div>
      ))}

      <FadeInSection
        as="section"
        className="border-t border-[var(--cf-border)] px-6 py-14"
      >
        <h2
          className={`${playfairDisplay.className} mb-8 text-center text-2xl font-semibold text-[var(--cf-ink)]`}
        >
          Por qué elegirme
        </h2>
        <div className="mx-auto grid max-w-3xl gap-5 sm:grid-cols-2">
          {whyUs.map((item, i) => (
            <div
              key={i}
              className="flex items-start gap-3 rounded-2xl bg-[var(--cf-surface-muted)] p-5 shadow-[0_8px_24px_rgba(27,79,114,.06)]"
            >
              <span className="text-2xl leading-none">{item.icono}</span>
              <p className="text-sm font-medium text-[var(--cf-ink)]">
                {item.titulo}
              </p>
            </div>
          ))}
        </div>
      </FadeInSection>

      {testimonios.length > 0 && (
        <FadeInSection
          as="section"
          className="border-t border-[var(--cf-border)] bg-[var(--cf-surface-muted)] px-6 py-14"
        >
          <h2
            className={`${playfairDisplay.className} mb-8 text-center text-2xl font-semibold text-[var(--cf-ink)]`}
          >
            Lo que dicen mis clientes
          </h2>
          <div className="mx-auto grid max-w-4xl gap-5 sm:grid-cols-3">
            {testimonios.map((t, i) => (
              <div
                key={i}
                className="rounded-2xl bg-[var(--cf-surface)] p-6 shadow-[0_8px_24px_rgba(27,79,114,.08)]"
              >
                <p className="mb-4 text-sm italic leading-relaxed text-[var(--cf-body)]">
                  &ldquo;{t.texto}&rdquo;
                </p>
                <p className="text-sm font-semibold text-[var(--cf-ink)]">
                  {t.nombre}
                </p>
                {t.cargo && (
                  <p className="text-xs text-[var(--cf-body)]">{t.cargo}</p>
                )}
              </div>
            ))}
          </div>
        </FadeInSection>
      )}

      {hasRedes && (
        <div className="flex justify-center gap-6 border-t border-[var(--cf-border)] px-6 py-6 text-sm font-medium text-[var(--cf-body)]">
          {isRealUrl(formData.linkedin_url) && (
            <a
              href={formData.linkedin_url}
              target="_blank"
              rel="noreferrer"
              className="transition-colors hover:text-[var(--cf-accent)]"
            >
              LinkedIn
            </a>
          )}
          {isRealUrl(formData.instagram_url) && (
            <a
              href={formData.instagram_url}
              target="_blank"
              rel="noreferrer"
              className="transition-colors hover:text-[var(--cf-accent)]"
            >
              Instagram
            </a>
          )}
        </div>
      )}

      <FloatingWhatsappButton phone={formData.phone} accentColor={accentColor} />
    </div>
  );
}

const SECTIONS: Record<
  string,
  (data: ContadorFormData) => React.ReactNode
> = {
  hero: (data) => {
    const name = capitalizeName(data.name ?? "");
    const matricula = isValidMatricula(data.matricula) ? data.matricula : undefined;
    return (
    <FadeInSection
      as="section"
      className="flex flex-col items-center gap-4 bg-gradient-to-b from-[var(--cf-accent-soft)] to-[var(--cf-surface)] px-6 py-16 text-center"
    >
      {data.profile_image ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={data.profile_image}
          alt={name}
          className="h-36 w-36 rounded-full border-4 border-white object-cover shadow-[0_8px_24px_rgba(27,79,114,.18)]"
        />
      ) : (
        <span className="flex h-36 w-36 items-center justify-center rounded-full border-4 border-white bg-[var(--cf-accent)] text-3xl font-semibold text-white shadow-[0_8px_24px_rgba(27,79,114,.18)]">
          {getInitials(name)}
        </span>
      )}
      <h1
        className={`${playfairDisplay.className} text-3xl font-semibold text-[var(--cf-ink)] sm:text-4xl`}
      >
        {name || "Tu nombre"}
      </h1>
      <p className="text-sm font-semibold uppercase tracking-wide text-[var(--cf-accent)]">
        {data.titulo_profesional ||
          (matricula
            ? `Contador Público matriculado${data.jurisdiccion ? ` · ${data.jurisdiccion}` : ""}`
            : "Contador Público")}
      </p>
      {matricula && (
        <p className="text-xs text-[var(--cf-body)]">
          Matrícula {matricula}
          {data.jurisdiccion ? ` · ${data.jurisdiccion}` : ""}
        </p>
      )}
      {(data.slogan || data.description) && (
        <p className="max-w-xl text-base text-[var(--cf-body)]">
          {data.slogan || data.description}
        </p>
      )}
      {data.phone && (
        <a
          href={buildWaLink(data.phone)}
          target="_blank"
          rel="noreferrer"
          className="mt-2 inline-flex min-h-12 items-center justify-center rounded-full bg-[var(--cf-accent)] px-8 text-sm font-semibold text-white shadow-[0_8px_24px_rgba(27,79,114,.26)] transition-transform hover:-translate-y-0.5"
        >
          {data.cta_text || "Consultá ahora"}
        </a>
      )}
    </FadeInSection>
    );
  },
  about: (data) => {
    const matricula = isValidMatricula(data.matricula) ? data.matricula : undefined;
    return data.description ||
    data.anos_experiencia ||
    data.cantidad_clientes ||
    matricula ? (
      <FadeInSection
        as="section"
        className="border-t border-[var(--cf-border)] bg-[var(--cf-surface-muted)] px-6 py-14"
      >
        <h2
          className={`${playfairDisplay.className} mb-6 text-center text-2xl font-semibold text-[var(--cf-ink)]`}
        >
          Sobre mí
        </h2>
        <div className="mx-auto max-w-2xl">
          {data.description && (
            <p className="mb-8 text-center leading-relaxed text-[var(--cf-body)]">
              {data.description}
            </p>
          )}
          <div className="flex flex-wrap justify-center gap-8 text-center text-sm text-[var(--cf-body)]">
            {data.anos_experiencia && (
              <div>
                <p
                  className={`${playfairDisplay.className} text-2xl font-semibold text-[var(--cf-ink)]`}
                >
                  {data.anos_experiencia}
                </p>
                <p>Años de experiencia</p>
              </div>
            )}
            {data.cantidad_clientes && (
              <div>
                <p
                  className={`${playfairDisplay.className} text-2xl font-semibold text-[var(--cf-ink)]`}
                >
                  {data.cantidad_clientes}
                </p>
                <p>Clientes atendidos</p>
              </div>
            )}
            {matricula && (
              <div>
                <p
                  className={`${playfairDisplay.className} text-2xl font-semibold text-[var(--cf-ink)]`}
                >
                  Mat. {matricula}
                </p>
                <p>{data.jurisdiccion || "Matrícula"}</p>
              </div>
            )}
          </div>
        </div>
      </FadeInSection>
    ) : null;
  },
  services: (data) => {
    const services = deriveContadorServiceEntries(data);
    if (services.length === 0) return null;
    return (
      <FadeInSection
        as="section"
        className="border-t border-[var(--cf-border)] px-6 py-14"
      >
        <h2
          className={`${playfairDisplay.className} mb-8 text-center text-2xl font-semibold text-[var(--cf-ink)]`}
        >
          Servicios
        </h2>
        <div className="mx-auto grid max-w-4xl gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {services.map((s, i) => (
            <div
              key={i}
              className="rounded-2xl border border-[var(--cf-border)] bg-[var(--cf-surface)] p-6 shadow-[0_8px_24px_rgba(27,79,114,.06)] transition-all hover:-translate-y-1 hover:shadow-[0_12px_32px_rgba(27,79,114,.14)]"
            >
              {s.icono && (
                <span className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-[var(--cf-accent-soft)] text-2xl">
                  {s.icono}
                </span>
              )}
              <h3 className="mb-2 text-base font-semibold text-[var(--cf-ink)]">
                {s.titulo}
              </h3>
              {s.descripcion && (
                <p className="text-sm text-[var(--cf-body)]">
                  {s.descripcion}
                </p>
              )}
            </div>
          ))}
        </div>
      </FadeInSection>
    );
  },
  contact: (data) => (
    <FadeInSection
      as="section"
      className="flex flex-col items-center gap-5 border-t border-[var(--cf-border)] bg-[var(--cf-surface-muted)] px-6 py-14 text-center"
    >
      <h2
        className={`${playfairDisplay.className} text-2xl font-semibold text-[var(--cf-ink)]`}
      >
        Contacto
      </h2>
      <div className="flex flex-col gap-1 text-sm text-[var(--cf-body)]">
        {data.zona && <p>Zona: {data.zona}</p>}
        {data.direccion && <p>{data.direccion}</p>}
        {data.modalidad && (
          <p>{MODALIDAD_LABELS[data.modalidad] ?? data.modalidad}</p>
        )}
        {data.horario_atencion && <p>{data.horario_atencion}</p>}
        {data.email && <p>Email: {data.email}</p>}
        {data.phone && <p>Tel: {data.phone}</p>}
      </div>
      {data.phone && (
        <a
          href={buildWaLink(data.phone)}
          target="_blank"
          rel="noreferrer"
          className="flex min-h-12 w-full max-w-xs items-center justify-center rounded-full bg-[var(--cf-accent)] px-6 text-sm font-semibold text-white shadow-[0_8px_24px_rgba(27,79,114,.24)] transition-colors hover:bg-[var(--cf-accent-dark)]"
        >
          Contactar por WhatsApp
        </a>
      )}
    </FadeInSection>
  ),
};
