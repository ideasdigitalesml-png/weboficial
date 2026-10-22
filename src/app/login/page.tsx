import Link from "next/link";
import { Wordmark } from "@/components/landing/Wordmark";
import { GoogleSignInButton } from "@/components/auth/GoogleSignInButton";

export default function LoginPage() {
  return (
    <div className="relative flex flex-1 flex-col items-center justify-center overflow-hidden bg-navy px-5 py-12">
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
        <div className="flex flex-col items-center gap-2 text-center">
          <Wordmark tone="white" className="text-2xl" />
          <p className="text-sm text-white/70">
            Tu página profesional, lista en minutos.
          </p>
        </div>

        <div className="flex w-full flex-col items-center gap-5 rounded-2xl bg-white p-6 shadow-2xl shadow-black/40 sm:p-8">
          <div className="flex flex-col items-center gap-1.5 text-center">
            <h1 className="text-xl font-semibold text-navy">
              Ingresá a tu cuenta
            </h1>
            <p className="text-sm text-text-body">
              Usá tu cuenta de Google para continuar
            </p>
          </div>

          <div className="w-full border-t border-border-subtle pt-5">
            <p className="mb-3 text-center text-xs text-text-body">
              Iniciá sesión para crear o administrar tu página profesional.
            </p>

            <GoogleSignInButton redirectTo="/" oneTap />

            <p className="mt-3 text-center text-xs text-text-body">
              ¿Primera vez? Se crea tu cuenta automáticamente.
            </p>
          </div>
        </div>

        <Link
          href="/"
          className="text-sm text-white/70 transition-colors hover:text-white"
        >
          ← Volver al inicio
        </Link>

        <ul className="flex flex-col items-center gap-2 text-sm text-white/50">
          <li className="flex items-center gap-2">
            <span className="text-emerald-400">✓</span>
            Tu página lista en menos de 10 minutos
          </li>
          <li className="flex items-center gap-2">
            <span className="text-emerald-400">✓</span>
            Sin conocimientos técnicos
          </li>
          <li className="flex items-center gap-2">
            <span className="text-emerald-400">✓</span>
            Cancelá cuando quieras
          </li>
        </ul>
      </div>
    </div>
  );
}
