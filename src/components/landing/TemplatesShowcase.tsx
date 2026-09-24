import Link from "next/link";

// Simplified, non-interactive previews of the real per-profession
// templates -- colors are pulled from each template's actual default
// palette (see src/lib/templates/*-paletas.ts and the psicologo template's
// DEFAULT_PRIMARY/ACCENT) so a visitor recognizes the same look once they
// land on the real onboarding preview.
const TEMPLATES = [
  {
    profession: "Contador",
    name: "Bosque",
    primary: "#0B2545",
    accent: "#1A6B4A",
    accentLt: "#EAF4EF",
  },
  {
    profession: "Abogado",
    name: "Dorado",
    primary: "#1C1C2E",
    accent: "#C9A84C",
    accentLt: "#FDF6E3",
  },
  {
    profession: "Psicólogo",
    name: "Sereno",
    primary: "#6b7f6b",
    accent: "#6b7f6b",
    accentLt: "#E9EEE7",
  },
] as const;

function TemplateCard({ profession, name, primary, accent, accentLt }: (typeof TEMPLATES)[number]) {
  return (
    <div className="w-64 shrink-0 snap-center overflow-hidden rounded-2xl border border-border-subtle bg-white shadow-lg shadow-navy/10">
      <div
        className="flex flex-col gap-2 px-4 py-5"
        style={{ backgroundColor: primary }}
      >
        <span
          className="h-9 w-9 rounded-full"
          style={{ background: `linear-gradient(135deg, ${accent}, ${primary})` }}
        />
        <span className="h-2 w-2/3 rounded-full bg-white/80" />
        <span className="h-1.5 w-1/2 rounded-full" style={{ backgroundColor: accent }} />
        <div className="mt-1 flex gap-1.5">
          <span
            className="rounded-full px-2 py-0.5 text-[9px] font-medium"
            style={{ backgroundColor: accentLt, color: primary }}
          >
            Servicio
          </span>
          <span
            className="rounded-full px-2 py-0.5 text-[9px] font-medium"
            style={{ backgroundColor: accentLt, color: primary }}
          >
            Servicio
          </span>
        </div>
      </div>
      <div className="flex items-center justify-between px-4 py-3">
        <span className="rounded-full bg-surface-muted px-2.5 py-1 text-xs font-semibold text-navy">
          {profession}
        </span>
        <span className="text-sm font-medium text-text-body">{name}</span>
      </div>
    </div>
  );
}

export function TemplatesShowcase() {
  return (
    <section className="bg-white px-6 py-12 sm:py-16">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-8">
        <h2 className="text-center text-3xl font-bold text-navy sm:text-4xl">
          Diseños pensados para profesionales
        </h2>
        <div className="-mx-6 flex snap-x snap-mandatory gap-4 overflow-x-auto px-6 pb-2 sm:mx-0 sm:justify-center sm:px-0">
          {TEMPLATES.map((template) => (
            <TemplateCard key={template.profession} {...template} />
          ))}
        </div>
        <div className="flex justify-center">
          <Link
            href="/onboarding"
            className="inline-flex items-center gap-1.5 text-base font-semibold text-sky transition-colors hover:text-sky-dark"
          >
            Ver todos los diseños
            <span aria-hidden>→</span>
          </Link>
        </div>
      </div>
    </section>
  );
}
