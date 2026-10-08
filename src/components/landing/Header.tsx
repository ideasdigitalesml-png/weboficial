import Link from "next/link";
import { Wordmark } from "./Wordmark";

// Shared by the home page and every /contadores, /abogados, /psicologos
// landing (via ProfessionLandingPage) -- sits absolutely over the navy
// Hero section on all of them, so one fix here fixes all four. Visible on
// every breakpoint: a mobile visitor needs the CTA as much as desktop does.
export function Header() {
  return (
    <header className="absolute inset-x-0 top-0 z-20">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-6">
        <Wordmark tone="white" className="text-lg" />
        <div className="flex items-center gap-2 sm:gap-3">
          <Link
            href="/login"
            className="inline-flex min-h-9 items-center justify-center rounded-full border border-sky-400/40 bg-sky-500/15 px-3 text-sm font-medium text-white transition-colors hover:bg-sky-500/25 sm:px-4"
          >
            Iniciar sesión
          </Link>
          <Link
            href="/onboarding"
            className="inline-flex min-h-9 items-center justify-center gap-1.5 rounded-full bg-sky px-3 text-sm font-semibold text-white transition-colors hover:bg-sky-dark sm:px-4 sm:py-2"
          >
            Armar mi página gratis
          </Link>
        </div>
      </div>
    </header>
  );
}
