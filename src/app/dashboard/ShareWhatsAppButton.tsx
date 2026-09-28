"use client";

import { markLandingSharedAction } from "./actions";

// Opens WhatsApp's own share compose screen (wa.me with no phone number,
// just a prefilled message) rather than sending anything ourselves --
// same "hand off to the OS/app share sheet" idea as a native share button,
// just WhatsApp-specific since that's what this audience actually uses.
export function ShareWhatsAppButton({ landingId, url }: { landingId: string; url: string }) {
  const message = `¡Mirá mi página! ${url}`;
  const href = `https://wa.me/?text=${encodeURIComponent(message)}`;

  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      onClick={() => {
        markLandingSharedAction(landingId);
      }}
      className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full border border-border-subtle px-4 text-sm font-medium text-navy transition-colors hover:border-navy/40"
    >
      Compartir por WhatsApp
    </a>
  );
}
