"use client";

import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Wordmark } from "@/components/landing/Wordmark";

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden="true">
      <path
        fill="#4285F4"
        d="M23.52 12.27c0-.85-.08-1.67-.22-2.45H12v4.64h6.47a5.53 5.53 0 0 1-2.4 3.63v3h3.87c2.27-2.09 3.58-5.17 3.58-8.82Z"
      />
      <path
        fill="#34A853"
        d="M12 24c3.24 0 5.96-1.07 7.94-2.91l-3.87-3c-1.08.72-2.45 1.15-4.07 1.15-3.13 0-5.78-2.11-6.73-4.96H1.27v3.11A12 12 0 0 0 12 24Z"
      />
      <path
        fill="#FBBC05"
        d="M5.27 14.28A7.2 7.2 0 0 1 4.89 12c0-.79.14-1.56.38-2.28V6.61H1.27A12 12 0 0 0 0 12c0 1.94.46 3.77 1.27 5.39l4-3.11Z"
      />
      <path
        fill="#EA4335"
        d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0A12 12 0 0 0 1.27 6.61l4 3.11C6.22 6.86 8.87 4.75 12 4.75Z"
      />
    </svg>
  );
}

export default function LoginPage() {
  const handleLogin = async () => {
    const supabase = createClient();
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });
  };

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

            <button
              onClick={handleLogin}
              className="flex min-h-[52px] w-full items-center justify-center gap-3 rounded-xl border-2 border-border-subtle bg-white px-6 text-base font-semibold text-navy shadow-sm transition-colors hover:bg-surface-muted"
            >
              <GoogleIcon />
              Continuar con Google
            </button>

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
      </div>
    </div>
  );
}
