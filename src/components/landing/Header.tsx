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
          {/* Mobile (<640px): plain text link, no border/bg, 44px tap
              target -- the pill treatment below only kicks in at sm: where
              there's room for it next to the second button. */}
          <Link
            href="/login"
            className="inline-flex min-h-11 items-center justify-center px-1 text-sm font-medium whitespace-nowrap text-white sm:min-h-9 sm:rounded-full sm:border sm:border-sky-400/40 sm:bg-sky-500/15 sm:px-4 sm:py-2 sm:transition-colors sm:hover:bg-sky-500/25"
          >
            <span className="sm:hidden">Ingresar</span>
            <span className="hidden sm:inline">Iniciar sesión</span>
          </Link>
          {/* Hidden on mobile -- the Hero already has a large version of
              this same CTA, so repeating it here only crowded the header
              and forced the text to wrap. */}
          <Link
            href="/onboarding"
            className="hidden items-center justify-center gap-1.5 rounded-full bg-sky px-3 text-sm font-semibold whitespace-nowrap text-white transition-colors hover:bg-sky-dark sm:inline-flex sm:px-4 sm:py-2"
          >
            Armar mi página gratis
          </Link>
        </div>
      </div>
    </header>
  );
}
