import Link from "next/link";

// Simplified, non-interactive previews of the real per-profession
// templates -- colors are pulled from each template's actual default
// palette (see src/lib/templates/*-paletas.ts and the psicologo template's
// DEFAULT_PRIMARY/ACCENT) so a visitor recognizes the same look once they
// land on the real onboarding preview.
//
// `titleColor` is deliberately separate from `accent`: accent also tints the
// avatar gradient (accent -> primary) behind white initials text, so it has
// to stay light enough there without going so light it breaks *that*
// contrast. The title text underneath sits directly on a flat `primary`
// background instead, which is a different, independently-checkable contrast
// pair -- accent alone didn't clear WCAG AA (4.5:1) against primary for
// contador (2.38:1) or psicologo (1.91:1); Lighthouse's color-contrast audit
// caught the contador one, and the psicologo one turned out to be exactly
// the same bug scanning the whole file for `accent` turned up. Abogado's
// gold was already well clear (7.32:1), so its titleColor is just accent.
const TEMPLATES = [
  {
    profession: "Contador",
    name: "Bosque",
    initials: "MG",
    fictionalName: "Martín García",
    title: "Contador Público",
    primary: "#0B2545",
    accent: "#1A6B4A",
    accentLt: "#EAF4EF",
    titleColor: "#3CB88A",
  },
  {
    profession: "Abogado",
    name: "Dorado",
    initials: "LS",
    fictionalName: "Laura Sosa",
    title: "Abogada",
    primary: "#1C1C2E",
    accent: "#C9A84C",
    accentLt: "#FDF6E3",
    titleColor: "#C9A84C",
  },
  {
    profession: "Psicólogo",
    name: "Sereno",
    initials: "AB",
    fictionalName: "Ana Beltrán",
    title: "Psicóloga",
    primary: "#5b6b5b",
    accent: "#8a9a8a",
    accentLt: "#E9EEE7",
    titleColor: "#EAF0EA",
  },
] as const;

function TemplateCard({
  profession,
  name,
  initials,
  fictionalName,
  title,
  primary,
  accent,
  accentLt,
  titleColor,
}: (typeof TEMPLATES)[number]) {
  return (
    <div className="relative w-64 shrink-0 snap-center overflow-hidden rounded-2xl border border-border-subtle bg-white shadow-lg shadow-navy/10">
      <span
        className="absolute top-3 right-3 z-10 rounded-full px-2.5 py-1 text-[10px] font-semibold shadow-sm"
        style={{ backgroundColor: accentLt, color: primary }}
      >
        {profession}
      </span>

      <div
        className="flex items-center gap-3 px-4 py-5"
        style={{ backgroundColor: primary }}
      >
        <span
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white ring-2 ring-white/15"
          style={{ background: `linear-gradient(135deg, ${accent}, ${primary})` }}
        >
          {initials}
        </span>
        <div className="flex flex-col gap-0.5">
          <span className="text-sm font-semibold text-white">{fictionalName}</span>
          <span className="text-[11px] font-medium" style={{ color: titleColor }}>
            {title}
          </span>
        </div>
      </div>

      <div className="flex flex-col gap-2 px-4 py-4">
        <span className="h-2 w-full rounded-full bg-slate-200" />
        <span className="h-2 w-5/6 rounded-full bg-slate-200" />
        <span className="h-2 w-3/5 rounded-full bg-slate-200" />
      </div>

      <div className="flex items-center justify-between border-t border-border-subtle px-4 py-3">
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
            Empezá a crear tu página
            <span aria-hidden>→</span>
          </Link>
        </div>
      </div>
    </section>
  );
}
