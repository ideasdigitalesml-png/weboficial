"use client";

import { useState } from "react";

// Same "Copiar link" pill treatment as WelcomeBanner.tsx on the customer
// dashboard, reused here for the reseller's own referral link.
export function CopyReferralLinkButton({ url }: { url: string }) {
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
      className="inline-flex shrink-0 items-center justify-center rounded-full border border-sky px-4 py-2 text-sm font-medium text-sky-dark transition-colors hover:bg-sky/10"
    >
      {copied ? "¡Copiado!" : "Copiar link"}
    </button>
  );
}
