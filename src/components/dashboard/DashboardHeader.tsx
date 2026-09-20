import Link from "next/link";
import { Wordmark } from "@/components/landing/Wordmark";

// Shared top bar for every /dashboard/* page. No sidebar by design (see
// AGENTS.md Feature 1) -- a single-column layout, so this header is the
// only persistent chrome.
export function DashboardHeader({ email }: { email: string }) {
  return (
    <header className="border-b border-border-subtle px-6 py-4">
      <div className="mx-auto flex w-full max-w-[900px] items-center justify-between">
        <Link href="/dashboard">
          <Wordmark className="text-lg" />
        </Link>
        <div className="flex items-center gap-4">
          <span className="text-sm text-text-body">{email}</span>
          <form action="/auth/signout" method="post">
            <button
              type="submit"
              className="rounded-full border border-border-subtle px-4 py-1.5 text-sm font-medium text-navy transition-colors hover:border-navy/40"
            >
              Cerrar sesión
            </button>
          </form>
        </div>
      </div>
    </header>
  );
}
