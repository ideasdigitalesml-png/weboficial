import type { Metadata } from "next";
import Link from "next/link";

// Every /ejemplo/* page renders a real template with a fictional profile
// (see src/lib/demo-profiles.ts) -- it must never compete with real
// professionals' pages for search ranking, hence the blanket noindex here
// instead of per-page metadata.
export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default function EjemploLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="relative flex flex-1 flex-col">
      <div className="sticky top-0 z-50 flex items-center justify-between gap-3 bg-navy px-4 py-3 text-white sm:px-6">
        <p className="text-sm font-medium sm:text-base">
          Página de ejemplo — así se vería la tuya
        </p>
        <Link
          href="/onboarding"
          className="inline-flex shrink-0 items-center justify-center gap-1.5 rounded-full bg-sky px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-sky-dark"
        >
          Crear mi página
          <span aria-hidden>→</span>
        </Link>
      </div>
      {children}
    </div>
  );
}
