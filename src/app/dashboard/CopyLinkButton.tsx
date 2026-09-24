"use client";

import { useState } from "react";

// Small icon-only copy affordance placed next to a plain-text/link URL
// (the hero card's public URL row). WelcomeBanner has its own larger
// "Copiar link" pill for the one-time post-payment banner -- this is the
// compact version for the persistent dashboard card.
export function CopyLinkButton({ url }: { url: string }) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <button
      type="button"
      onClick={handleCopy}
      aria-label="Copiar URL"
      className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-border-subtle text-navy transition-colors hover:border-navy/40 hover:bg-surface-muted"
    >
      {copied ? (
        <svg viewBox="0 0 20 20" fill="none" className="h-4 w-4 text-emerald-600" aria-hidden>
          <path d="M4 10.5l3.5 3.5L16 5.5" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      ) : (
        <svg viewBox="0 0 20 20" fill="none" className="h-4 w-4" aria-hidden>
          <rect x="7" y="7" width="10" height="10" rx="1.5" stroke="currentColor" strokeWidth="1.4" />
          <path d="M4.5 12.5h-1a1 1 0 0 1-1-1v-8a1 1 0 0 1 1-1h8a1 1 0 0 1 1 1v1" stroke="currentColor" strokeWidth="1.4" />
        </svg>
      )}
    </button>
  );
}
