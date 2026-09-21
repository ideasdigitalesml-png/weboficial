import Link from "next/link";

// A browser-chrome mockup showing a miniature of the real
// ContadorModernoTemplate design (navy #0B2545 + green #1A6B4A accents) --
// a visitor needs to recognize "that's what my page would look like"
// within a couple seconds, which a generic gray wireframe can't do. Swap
// for an actual screenshot once one exists.
function BrowserMockup() {
  return (
    <div className="w-full max-w-sm scale-90 md:max-w-md md:scale-100">
      <div className="overflow-hidden rounded-2xl border border-white/10 bg-white/5 shadow-2xl shadow-black/40">
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
              Lic. Martín García
            </span>
            <div className="flex gap-2">
              <span className="h-1.5 w-6 rounded-full bg-white/40" />
              <span className="h-1.5 w-6 rounded-full bg-white/40" />
              <span className="h-1.5 w-6 rounded-full bg-white/40" />
            </div>
          </div>

          {/* Fake hero: text left, avatar right */}
          <div className="grid grid-cols-[1.4fr_1fr] items-center gap-3 px-4 py-6">
            <div className="flex flex-col gap-2">
              <span className="h-[3px] w-8 rounded-full bg-[#1A6B4A]" />
              <span className="font-serif text-[13px] leading-tight font-bold text-white">
                Martín García
              </span>
              <span className="text-[8px] text-white/60">
                Contador Público · Mat. 12.847
              </span>
              <div className="mt-1 flex gap-1.5">
                <span className="rounded-full border border-[#1A6B4A]/50 bg-[#1A6B4A]/30 px-2 py-0.5 text-[7px] text-emerald-300">
                  Impuestos
                </span>
                <span className="rounded-full border border-[#1A6B4A]/50 bg-[#1A6B4A]/30 px-2 py-0.5 text-[7px] text-emerald-300">
                  Sociedades
                </span>
              </div>
            </div>
            <div className="flex justify-end">
              <div
                className="h-14 w-14 shrink-0 rounded-full"
                style={{
                  background: "linear-gradient(135deg, #1A6B4A, #0B2545)",
                }}
              />
            </div>
          </div>

          {/* Fake contact section */}
          <div className="flex flex-col gap-2 bg-[#0d2240] px-4 py-4">
            <div className="flex items-center gap-2">
              <span className="h-3 w-3 shrink-0 rounded bg-[#1A6B4A]" />
              <span className="text-[8px] text-white/50">
                WhatsApp: 11 2345-6789
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="h-3 w-3 shrink-0 rounded bg-[#1A6B4A]" />
              <span className="text-[8px] text-white/50">
                contacto@estudio.com
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function Hero({
  title = "Tu página profesional, lista en minutos.",
}: {
  title?: string;
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
            Para contadores y abogados
          </span>
          <h1
            className="text-3xl leading-tight font-bold text-white sm:text-4xl md:text-5xl"
            style={{ animation: "fadeInUp 0.6s ease both", animationDelay: "0.2s" }}
          >
            {title}
          </h1>
          <p
            className="max-w-md text-lg text-white/65"
            style={{ animation: "fadeInUp 0.6s ease both", animationDelay: "0.3s" }}
          >
            Sin programar, sin complicaciones. Elegís tu diseño, completás tus
            datos y listo.
          </p>

          <div
            className="inline-flex flex-wrap items-center justify-center gap-3 rounded-full border border-white/10 bg-white/[.08] px-4 py-2 text-sm md:justify-start"
            style={{ animation: "fadeInUp 0.6s ease both", animationDelay: "0.4s" }}
          >
            <span className="font-semibold text-white">$13.400/mes</span>
            <span className="text-white/30">·</span>
            <span className="font-semibold text-[#00b1ea]">Mercado Pago</span>
            <span className="text-white/30">·</span>
            <span className="text-white/60">Cancelá cuando quieras</span>
          </div>

          <Link
            href="/onboarding"
            className="group inline-flex items-center gap-2 rounded-xl bg-sky px-8 py-4 text-base font-semibold text-white shadow-lg shadow-sky-500/25 transition-all hover:-translate-y-0.5 hover:bg-sky-600"
            style={{ animation: "fadeInUp 0.6s ease both", animationDelay: "0.5s" }}
          >
            Creá tu página
            <span className="transition-transform group-hover:translate-x-0.5">
              →
            </span>
          </Link>

          <p
            className="text-sm text-white/35"
            style={{ animation: "fadeInUp 0.6s ease both", animationDelay: "0.6s" }}
          >
            Sin permanencia · Sin tarjeta de crédito
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
            <BrowserMockup />
          </div>
        </div>
      </div>
    </section>
  );
}
