import type { SectionConfigItem } from "@/lib/landings/update-landing";
import { serviceLabels } from "@/lib/professions/contadores";
import { buildWaLink } from "@/lib/whatsapp";

// This is the contador's own client-facing page -- deliberately not styled
// with weboficial's navy/sky brand tokens (globals.css). The palette lives
// entirely in the --cf-* CSS variables below so it stays independent of the
// platform's own branding and can vary per template later.
const MODALIDAD_LABELS: Record<string, string> = {
  presencial: "Atención presencial",
  remoto: "Atención remota",
  ambos: "Atención presencial y remota",
};

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
}

// Default accent is the approved "Clásico" palette's emerald. Other
// templates can pass their own accentColor once their own palettes go
// through the same review -- everything else (ink/body/surface/border)
// stays constant across templates on purpose, so they read as one family.
const DEFAULT_ACCENT = "#0F7A5C";

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

  return (
    <div
      style={
        {
          "--cf-ink": "#1C2126",
          "--cf-body": "#4B5563",
          "--cf-surface": "#FFFFFF",
          "--cf-surface-muted": "#F7F8F9",
          "--cf-border": "#E5E7EB",
          "--cf-accent": accentColor,
          "--cf-accent-dark": `color-mix(in srgb, ${accentColor} 80%, black)`,
          "--cf-accent-soft": `color-mix(in srgb, ${accentColor} 12%, white)`,
        } as React.CSSProperties
      }
      className="flex min-h-full flex-col bg-[var(--cf-surface)] text-[var(--cf-ink)]"
    >
      {sections.map((section) => (
        <div key={section.id}>{SECTIONS[section.id](formData)}</div>
      ))}
    </div>
  );
}

const SECTIONS: Record<
  string,
  (data: ContadorFormData) => React.ReactNode
> = {
  hero: (data) => (
    <div className="flex flex-col items-center gap-4 px-6 py-12 text-center">
      {data.profile_image && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={data.profile_image}
          alt={data.name ?? ""}
          className="h-28 w-28 rounded-full border border-[var(--cf-border)] object-cover"
        />
      )}
      <h1 className="text-2xl font-semibold text-[var(--cf-ink)]">
        {data.name || "Tu nombre"}
      </h1>
      {(data.matricula || data.jurisdiccion) && (
        <p className="text-sm text-[var(--cf-body)]">
          Contador Público matriculado
          {data.matricula ? ` — Matrícula ${data.matricula}` : ""}
          {data.jurisdiccion ? ` · ${data.jurisdiccion}` : ""}
        </p>
      )}
    </div>
  ),
  about: (data) =>
    data.description ? (
      <div className="border-t border-[var(--cf-border)] bg-[var(--cf-surface-muted)] px-6 py-10">
        <h2 className="mb-3 text-lg font-semibold">Quiénes somos</h2>
        <p className="text-[var(--cf-body)] leading-relaxed">
          {data.description}
        </p>
      </div>
    ) : null,
  services: (data) =>
    data.servicios && data.servicios.length > 0 ? (
      <div className="border-t border-[var(--cf-border)] px-6 py-10">
        <h2 className="mb-4 text-lg font-semibold">Servicios</h2>
        <div className="flex flex-wrap gap-2">
          {serviceLabels(data.servicios).map((label) => (
            <span
              key={label}
              className="rounded-full border border-[var(--cf-accent)] bg-[var(--cf-accent-soft)] px-4 py-2 text-sm font-medium text-[var(--cf-ink)]"
            >
              {label}
            </span>
          ))}
        </div>
      </div>
    ) : null,
  contact: (data) => (
    <div className="flex flex-col items-start gap-4 border-t border-[var(--cf-border)] bg-[var(--cf-surface-muted)] px-6 py-10">
      <h2 className="text-lg font-semibold">Contacto</h2>
      <div className="flex flex-col gap-1 text-sm text-[var(--cf-body)]">
        {data.zona && <p>Zona: {data.zona}</p>}
        {data.modalidad && (
          <p>{MODALIDAD_LABELS[data.modalidad] ?? data.modalidad}</p>
        )}
        {data.email && <p>Email: {data.email}</p>}
      </div>
      {data.phone && (
        <a
          href={buildWaLink(data.phone)}
          target="_blank"
          rel="noreferrer"
          className="flex min-h-12 w-full items-center justify-center rounded-full bg-[var(--cf-accent)] px-6 text-sm font-semibold text-white transition-colors hover:bg-[var(--cf-accent-dark)] sm:w-auto"
        >
          Contactar por WhatsApp
        </a>
      )}
    </div>
  ),
};
