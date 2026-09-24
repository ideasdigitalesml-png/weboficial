import Link from "next/link";
import { Wordmark } from "@/components/landing/Wordmark";
import { getInitials } from "@/lib/avatar-initials";

// Shared top bar for every /dashboard/* page. No sidebar by design (see
// AGENTS.md Feature 1) -- a single-column layout, so this header is the
// only persistent chrome. `name` is the professional's display name when
// known (falls back to email) -- only the main /dashboard page has it on
// hand today, every other page here still just passes email.
export function DashboardHeader({
  email,
  name,
}: {
  email: string;
  name?: string;
}) {
  const displayName = name?.trim() || email;

  return (
    <header className="border-b border-border-subtle px-5 py-3 sm:px-6 sm:py-4">
      <div className="mx-auto flex w-full max-w-[900px] items-center justify-between gap-3">
        <Link href="/dashboard" className="shrink-0">
          <Wordmark className="text-base sm:text-lg" />
        </Link>
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex min-w-0 items-center gap-2">
            <span
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[11px] font-bold text-white"
              style={{ background: "linear-gradient(135deg, #3b82f6, #0f2044)" }}
            >
              {getInitials(displayName)}
            </span>
            <span className="hidden truncate text-sm text-navy sm:inline">
              {displayName}
            </span>
          </div>
          <form action="/auth/signout" method="post">
            <button
              type="submit"
              className="inline-flex min-h-9 shrink-0 items-center justify-center rounded-full border border-border-subtle px-3 text-xs font-medium text-navy transition-colors hover:border-navy/40 sm:min-h-11 sm:px-4 sm:text-sm"
            >
              Cerrar sesión
            </button>
          </form>
        </div>
      </div>
    </header>
  );
}
