import Link from "next/link";
import { Wordmark } from "@/components/landing/Wordmark";

export default function NotFound() {
  return (
    <div className="relative flex flex-1 flex-col items-center justify-center overflow-hidden bg-navy px-5 py-12 text-center">
      <div
        aria-hidden
        className="pointer-events-none absolute -top-24 right-[-100px] h-[420px] w-[420px] rounded-full bg-sky-500/10 blur-3xl"
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

      <div className="relative flex w-full max-w-sm flex-col items-center gap-6">
        <Wordmark tone="white" className="text-2xl" />

        <p className="font-display text-7xl font-bold text-sky sm:text-8xl">
          404
        </p>

        <div className="flex flex-col items-center gap-2">
          <h1 className="text-xl font-semibold text-white sm:text-2xl">
            Esta página no existe
          </h1>
          <p className="text-sm text-white/60">
            El subdominio que buscás no está disponible o fue dado de baja.
          </p>
        </div>

        <div className="flex w-full flex-col gap-3 sm:flex-row">
          <Link
            href="/"
            className="inline-flex min-h-[52px] flex-1 items-center justify-center rounded-full bg-sky px-8 text-base font-semibold text-white transition-colors hover:bg-sky-dark"
          >
            Volver al inicio
          </Link>
          <Link
            href="/onboarding"
            className="inline-flex min-h-[52px] flex-1 items-center justify-center rounded-full border border-white/25 bg-white/5 px-8 text-base font-semibold text-white transition-colors hover:bg-white/10"
          >
            Crear mi página
          </Link>
        </div>
      </div>
    </div>
  );
}
