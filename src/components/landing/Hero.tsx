import Link from "next/link";
import Image from "next/image";
import {
  CONTADOR_DEMO_PROFILE,
  ABOGADO_DEMO_PROFILE,
  PSICOLOGO_DEMO_PROFILE,
} from "@/lib/demo-profiles";

export interface HeroPreviewImage {
  src: string;
  alt: string;
}

// Real per-profession screenshots (see /public/previews/) shown as a small
// grid instead of the BrowserMockup fallback below -- only passed by the
// home page, which wants to show all three professions at once. Profession
// landing pages (/contadores, /abogados, /psicologos) render just one
// profession's own previews lower on the page (see ProfessionLandingPage),
// so they keep the generic BrowserMockup here instead.
function PreviewGrid({ images }: { images: HeroPreviewImage[] }) {
  return (
    <div className="grid w-full max-w-sm grid-cols-3 gap-3 md:max-w-md">
      {images.map((image, index) => (
        <div
          key={image.src}
          className="overflow-hidden rounded-xl border border-white/10 shadow-lg shadow-black/40"
        >
          <Image
            src={image.src}
            alt={image.alt}
            width={200}
            height={125}
            className="h-auto w-full"
            priority={index === 0}
            loading={index === 0 ? undefined : "lazy"}
          />
        </div>
      ))}
    </div>
  );
}

export type HeroProfession = "contadores" | "abogados" | "psicologos";

// Same fictional identity as src/lib/demo-profiles.ts, so this mockup never
// drifts from what the real previews further down the page show -- matricula,
// name/prefix, and contact are all read from there instead of hardcoded a
// second time. Only the two tag labels and the formatted phone (purely
// decorative, never a real link) are mockup-specific.
const MOCKUP_DATA: Record<
  HeroProfession,
  {
    name: string;
    title: string;
    matricula: string;
    phoneDisplay: string;
    email: string;
    badges: [string, string];
  }
> = {
  contadores: {
    name: CONTADOR_DEMO_PROFILE.name!,
    title: "Contador Público",
    matricula: CONTADOR_DEMO_PROFILE.matricula!,
    phoneDisplay: "341 555-0123",
    email: CONTADOR_DEMO_PROFILE.email!,
    badges: ["Impuestos", "Sociedades"],
  },
  abogados: {
    name: ABOGADO_DEMO_PROFILE.name!,
    title: "Abogada",
    matricula: ABOGADO_DEMO_PROFILE.matricula_numero!,
    phoneDisplay: "221 555-0167",
    email: ABOGADO_DEMO_PROFILE.email!,
    badges: ["Familia", "Sucesiones"],
  },
  psicologos: {
    name: PSICOLOGO_DEMO_PROFILE.name!,
    title: "Psicóloga Clínica",
    matricula: PSICOLOGO_DEMO_PROFILE.matricula_numero!,
    phoneDisplay: "11 5555-0142",
    email: PSICOLOGO_DEMO_PROFILE.email!,
    badges: ["Ansiedad", "Autoestima"],
  },
};

// A browser-chrome mockup showing a miniature of the real
// ContadorModernoTemplate design (navy #0B2545 + green #1A6B4A accents) --
// a visitor needs to recognize "that's what my page would look like"
// within a couple seconds, which a generic gray wireframe can't do. Used on
// profession pages, which show that profession's own real previews further
// down instead.
function BrowserMockup({ profession = "contadores" }: { profession?: HeroProfession }) {
  const data = MOCKUP_DATA[profession];
  return (
    <div className="w-full max-w-sm scale-90 md:max-w-md md:scale-100">
      <div
        className="overflow-hidden rounded-2xl border border-white/10 bg-white/5"
        style={{
          boxShadow:
            "0 30px 60px -20px rgba(0,0,0,0.55), 0 10px 25px -10px rgba(0,0,0,0.4)",
        }}
      >
        <div className="flex items-center gap-2 border-b border-white/10 bg-white/[.08] px-4 py-3">
          <span className="h-2.5 w-2.5 rounded-full bg-red-400" />
          <span className="h-2.5 w-2.5 rounded-full bg-yellow-400" />
          <span className="h-2.5 w-2.5 rounded-full bg-green-400" />
          <span className="ml-2 flex-1 truncate rounded-full bg-white/10 px-3 py-1 text-xs text-white/30">
            nombre.weboficial.com.ar
          </span>
        </div>

        <div className="flex flex-col bg-[#0B2545]">
          {/* Fake page header */}
          <div className="flex items-center justify-between border-b border-[#1A6B4A]/40 px-4 py-2.5">
            <span className="text-[9px] font-semibold text-white">
              {data.name}
            </span>
            <div className="flex gap-2">
              <span className="h-1.5 w-6 rounded-full bg-white/40" />
              <span className="h-1.5 w-6 rounded-full bg-white/40" />
              <span className="h-1.5 w-6 rounded-full bg-white/40" />
            </div>
          </div>

          {/* Fake hero: avatar + name, then badges */}
          <div className="flex flex-col gap-3 px-4 py-5">
            <div className="flex items-center gap-3">
              <div
                className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full text-[13px] font-bold text-white ring-2 ring-white/15"
                style={{
                  background: "linear-gradient(135deg, #3b82f6, #0f2044)",
                }}
              >
                {data.name
                  .split(" ")
                  .slice(-2)
                  .map((w) => w[0])
                  .join("")
                  .toUpperCase()}
              </div>
              <div className="flex flex-col gap-1">
                <span className="font-serif text-[13px] leading-tight font-bold text-white">
                  {data.name}
                </span>
                <span className="text-[8px] text-white/60">
                  {data.title} · Mat. {data.matricula}
                </span>
              </div>
            </div>
            <div className="flex gap-1.5">
              <span className="rounded-full border border-[#1A6B4A]/50 bg-[#1A6B4A]/30 px-2 py-0.5 text-[7px] text-emerald-300">
                {data.badges[0]}
              </span>
              <span className="rounded-full border border-[#1A6B4A]/50 bg-[#1A6B4A]/30 px-2 py-0.5 text-[7px] text-emerald-300">
                {data.badges[1]}
              </span>
            </div>
          </div>

          {/* Fake contact section -- plain text, never a real link */}
          <div className="flex flex-col gap-2 bg-[#0d2240] px-4 py-4">
            <div className="flex items-center gap-2 rounded-lg bg-[#25D366]/15 px-2.5 py-1.5">
              <svg
                viewBox="0 0 24 24"
                className="h-3 w-3 shrink-0 fill-[#25D366]"
                aria-hidden
              >
                <path d="M12.04 2c-5.52 0-10 4.48-10 10 0 1.77.46 3.44 1.27 4.89L2 22l5.24-1.27A9.96 9.96 0 0 0 12.04 22c5.52 0 10-4.48 10-10s-4.48-10-10-10Zm0 18.13c-1.58 0-3.06-.44-4.32-1.22l-.31-.18-3.11.76.77-3.03-.2-.32A8.07 8.07 0 0 1 3.9 12c0-4.49 3.65-8.14 8.14-8.14S20.18 7.51 20.18 12s-3.65 8.13-8.14 8.13Zm4.46-6.09c-.24-.12-1.44-.71-1.66-.79-.22-.08-.38-.12-.55.12-.16.24-.63.79-.77.95-.14.16-.28.18-.52.06-.24-.12-1.02-.38-1.94-1.2-.72-.64-1.2-1.43-1.34-1.67-.14-.24-.02-.37.11-.49.11-.11.24-.28.36-.42.12-.14.16-.24.24-.4.08-.16.04-.3-.02-.42-.06-.12-.55-1.33-.76-1.82-.2-.48-.4-.42-.55-.42-.14-.01-.3-.01-.46-.01-.16 0-.42.06-.64.3-.22.24-.84.82-.84 2s.86 2.32.98 2.48c.12.16 1.7 2.6 4.13 3.64.58.25 1.03.4 1.38.51.58.18 1.11.16 1.53.1.47-.07 1.44-.59 1.64-1.16.2-.57.2-1.06.14-1.16-.06-.1-.22-.16-.46-.28Z" />
              </svg>
              <span className="text-[8px] font-medium text-white/80">
                WhatsApp: {data.phoneDisplay}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <svg
                viewBox="0 0 24 24"
                className="h-3 w-3 shrink-0 fill-none stroke-white/50"
                strokeWidth={2}
                aria-hidden
              >
                <rect x="2" y="4" width="20" height="16" rx="2" />
                <path d="m2 6 10 7 10-7" />
              </svg>
              <span className="text-[8px] text-white/50">{data.email}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function Hero({
  title = "Tu página profesional en 10 minutos. Sin programadores.",
  eyebrow = "Para contadores, abogados y psicólogos",
  subtitle = "Elegís un diseño, cargás tus datos y tus clientes te piden turno directo a tu WhatsApp. Todo por $13.400 por mes.",
  previewImages,
  profession = "contadores",
}: {
  title?: string;
  eyebrow?: string;
  subtitle?: string;
  previewImages?: HeroPreviewImage[];
  profession?: HeroProfession;
}) {
  return (
    <section className="relative w-full overflow-hidden bg-navy">
      <div
        aria-hidden
        className="pointer-events-none absolute -top-24 right-[-120px] h-[600px] w-[600px] rounded-full bg-sky-500/10 blur-3xl md:right-[5%]"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage:
            "radial-gradient(rgba(255,255,255,0.6) 1px, transparent 1px)",
          backgroundSize: "24px 24px",
        }}
      />

      <div className="relative mx-auto flex min-h-screen w-full max-w-6xl flex-col items-center justify-center gap-12 px-6 pt-20 pb-16 md:flex-row md:gap-16 md:pt-24">
        <div className="flex w-full flex-col items-center gap-5 text-center md:w-1/2 md:items-start md:text-left">
          <span
            className="text-xs font-semibold tracking-[0.2em] text-sky-400 uppercase"
            style={{ animation: "fadeInUp 0.6s ease both", animationDelay: "0.1s" }}
          >
            {eyebrow}
          </span>
          <h1
            className="text-3xl leading-tight font-bold text-white sm:text-4xl md:text-5xl"
            style={{ animation: "fadeInUp 0.6s ease both", animationDelay: "0.2s" }}
          >
            {title}
          </h1>
          <p
            className="max-w-md text-base text-white/65 md:text-lg"
            style={{ animation: "fadeInUp 0.6s ease both", animationDelay: "0.3s" }}
          >
            {subtitle}
          </p>

          <Link
            href="/onboarding"
            // bg-sky-dark (not bg-sky): white-on-#0284c7 only hits 4.09:1,
            // just under WCAG AA's 4.5:1 for this text size -- Lighthouse's
            // color-contrast audit flagged it. sky-dark (#0369a1) clears
            // 5.93:1.
            className="group inline-flex items-center gap-2 rounded-xl bg-sky-dark px-8 py-4 text-base font-semibold text-white shadow-lg shadow-sky-500/25 transition-all hover:-translate-y-0.5 hover:bg-sky-800"
            style={{ animation: "fadeInUp 0.6s ease both", animationDelay: "0.4s" }}
          >
            Armar mi página gratis
            <span className="transition-transform group-hover:translate-x-0.5">
              →
            </span>
          </Link>

          <p
            className="text-sm text-white/50"
            style={{ animation: "fadeInUp 0.6s ease both", animationDelay: "0.5s" }}
          >
            Pagás con Mercado Pago · Solo cuando la publicás · Cancelás cuando
            quieras
          </p>
        </div>

        <div className="relative flex w-full justify-center md:w-1/2">
          <div
            aria-hidden
            className="pointer-events-none absolute top-1/2 left-1/2 h-[500px] w-[500px] -translate-x-1/2 -translate-y-1/2 rounded-full blur-3xl"
            style={{
              background:
                "radial-gradient(circle, rgba(14,165,233,0.20) 0%, transparent 70%)",
            }}
          />
          <div
            className="relative"
            style={{
              animation:
                "fadeInRight 0.7s ease both, float 6s ease-in-out 1s infinite",
              animationDelay: "0.3s",
            }}
          >
            {previewImages ? (
              <PreviewGrid images={previewImages} />
            ) : (
              <BrowserMockup profession={profession} />
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
