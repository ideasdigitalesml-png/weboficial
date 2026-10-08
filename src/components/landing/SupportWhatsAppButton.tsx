"use client";

import { usePathname } from "next/navigation";
import { buildSupportWaLink } from "@/lib/support-whatsapp";

// Only these exact public marketing paths get the floating button -- never
// /ejemplo/*, /onboarding, /dashboard, or a client's own landing (/[slug],
// rewritten from a subdomain/custom domain, never matches this whitelist).
// Rendered once from the root layout instead of once per page, so this
// whitelist is the single place that decides where it shows.
const ALLOWED_PATHS = new Set([
  "/",
  "/contadores",
  "/abogados",
  "/psicologos",
  "/terminos",
  "/privacidad",
]);

export function SupportWhatsAppButton({ number }: { number?: string }) {
  const pathname = usePathname();

  if (!number || !ALLOWED_PATHS.has(pathname)) return null;

  return (
    <a
      href={buildSupportWaLink(number)}
      target="_blank"
      rel="noreferrer"
      aria-label="Hablar por WhatsApp con soporte"
      className="fixed bottom-5 right-5 z-30 flex h-14 w-14 items-center justify-center rounded-full bg-[#25D366] text-white shadow-lg shadow-black/20 transition-transform hover:scale-105"
    >
      <svg viewBox="0 0 24 24" width="28" height="28" fill="currentColor" aria-hidden>
        <path d="M12.04 2c-5.52 0-10 4.48-10 10 0 1.77.46 3.44 1.27 4.89L2 22l5.24-1.27A9.96 9.96 0 0 0 12.04 22c5.52 0 10-4.48 10-10s-4.48-10-10-10Zm0 18.13c-1.58 0-3.06-.44-4.32-1.22l-.31-.18-3.11.76.77-3.03-.2-.32A8.07 8.07 0 0 1 3.9 12c0-4.49 3.65-8.14 8.14-8.14S20.18 7.51 20.18 12s-3.65 8.13-8.14 8.13Zm4.46-6.09c-.24-.12-1.44-.71-1.66-.79-.22-.08-.38-.12-.55.12-.16.24-.63.79-.77.95-.14.16-.28.18-.52.06-.24-.12-1.02-.38-1.94-1.2-.72-.64-1.2-1.43-1.34-1.67-.14-.24-.02-.37.11-.49.11-.11.24-.28.36-.42.12-.14.16-.24.24-.4.08-.16.04-.3-.02-.42-.06-.12-.55-1.33-.76-1.82-.2-.48-.4-.42-.55-.42-.14-.01-.3-.01-.46-.01-.16 0-.42.06-.64.3-.22.24-.84.82-.84 2s.86 2.32.98 2.48c.12.16 1.7 2.6 4.13 3.64.58.25 1.03.4 1.38.51.58.18 1.11.16 1.53.1.47-.07 1.44-.59 1.64-1.16.2-.57.2-1.06.14-1.16-.06-.1-.22-.16-.46-.28Z" />
      </svg>
    </a>
  );
}
