"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home,
  LayoutTemplate,
  Globe,
  CreditCard,
  User,
  HelpCircle,
  Menu,
  X,
  ExternalLink,
} from "lucide-react";
import { Wordmark } from "@/components/landing/Wordmark";

const NAV_ITEMS = [
  { href: "/dashboard", label: "Inicio", icon: Home },
  { href: "/dashboard/mi-pagina", label: "Mi página", icon: LayoutTemplate },
  { href: "/dashboard/dominio", label: "Mi dominio", icon: Globe },
  { href: "/dashboard/suscripcion", label: "Mi suscripción", icon: CreditCard },
  { href: "/dashboard/cuenta", label: "Mi cuenta", icon: User },
  { href: "/dashboard/ayuda", label: "Ayuda", icon: HelpCircle },
] as const;

export interface DashboardNavProps {
  // Custom domain (if active) takes priority over the subdomain -- same
  // "canonical once active" rule as proxy.ts's subdomain->custom-domain
  // redirect. Null only when the landing has no working public URL yet
  // (still a draft, no active custom domain either).
  publicUrl: string | null;
  isActive: boolean;
}

function SidebarContent({
  publicUrl,
  isActive,
  onNavigate,
}: DashboardNavProps & { onNavigate?: () => void }) {
  const pathname = usePathname();

  return (
    <div className="flex h-full flex-col">
      <div className="flex flex-col gap-2 border-b border-border-subtle p-4">
        {publicUrl ? (
          <div className="flex min-w-0 items-center gap-1.5">
            <a
              href={publicUrl}
              target="_blank"
              rel="noreferrer"
              className="truncate text-sm font-medium text-navy hover:underline"
            >
              {publicUrl.replace(/^https?:\/\//, "")}
            </a>
            <a
              href={publicUrl}
              target="_blank"
              rel="noreferrer"
              aria-label="Abrir mi página en una pestaña nueva"
              className="shrink-0 text-text-body transition-colors hover:text-navy"
            >
              <ExternalLink className="h-4 w-4" aria-hidden />
            </a>
          </div>
        ) : (
          <p className="text-sm text-text-body">Todavía no tenés una URL propia</p>
        )}
        {isActive ? (
          <span className="inline-flex w-fit items-center rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700">
            Página activa
          </span>
        ) : (
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex w-fit items-center rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-700">
              Pendiente de pago
            </span>
            <Link
              href="/dashboard"
              onClick={onNavigate}
              className="text-xs font-semibold text-sky-dark underline"
            >
              Activar
            </Link>
          </div>
        )}
      </div>

      <nav className="flex flex-1 flex-col gap-1 p-3">
        {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
          const active = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              onClick={onNavigate}
              aria-current={active ? "page" : undefined}
              className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                active
                  ? "bg-sky/10 text-sky-dark"
                  : "text-navy hover:bg-surface-muted"
              }`}
            >
              <Icon className="h-[18px] w-[18px] shrink-0" aria-hidden />
              {label}
            </Link>
          );
        })}
      </nav>

      <form action="/auth/signout" method="post" className="border-t border-border-subtle p-3">
        <button
          type="submit"
          className="w-full rounded-lg px-3 py-2.5 text-left text-sm font-medium text-text-body transition-colors hover:bg-surface-muted hover:text-navy"
        >
          Cerrar sesión
        </button>
      </form>
    </div>
  );
}

// Mobile: a slim top bar (hamburger + wordmark) plus a drawer that slides in
// from the left over a dark overlay. Desktop (md+): the same content as a
// permanently visible left sidebar, no top bar needed. Closes itself on
// route change (onNavigate) so picking a section on mobile doesn't leave
// the drawer open over the new page.
export function DashboardNav({ publicUrl, isActive }: DashboardNavProps) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [open]);

  return (
    <>
      <div className="flex items-center justify-between border-b border-border-subtle px-4 py-3 md:hidden">
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label="Abrir menú"
          className="flex h-9 w-9 items-center justify-center rounded-lg text-navy transition-colors hover:bg-surface-muted"
        >
          <Menu className="h-5 w-5" aria-hidden />
        </button>
        <Wordmark className="text-base" />
        <span className="w-9" aria-hidden />
      </div>

      {open && (
        <div className="fixed inset-0 z-50 md:hidden">
          <button
            type="button"
            aria-label="Cerrar menú"
            onClick={() => setOpen(false)}
            className="absolute inset-0 bg-navy/40"
          />
          <div className="absolute inset-y-0 left-0 flex w-72 max-w-[85vw] flex-col bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-border-subtle px-4 py-3">
              <Wordmark className="text-base" />
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Cerrar menú"
                className="flex h-9 w-9 items-center justify-center rounded-lg text-navy transition-colors hover:bg-surface-muted"
              >
                <X className="h-5 w-5" aria-hidden />
              </button>
            </div>
            <SidebarContent
              publicUrl={publicUrl}
              isActive={isActive}
              onNavigate={() => setOpen(false)}
            />
          </div>
        </div>
      )}

      <aside className="hidden w-64 shrink-0 border-r border-border-subtle md:block">
        <SidebarContent publicUrl={publicUrl} isActive={isActive} />
      </aside>
    </>
  );
}
