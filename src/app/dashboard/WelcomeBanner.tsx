"use client";

import { useState } from "react";

// Shown once, right after ProcessingPoller confirms the subscription and
// redirects here with ?bienvenida=1 (see ProcessingPoller.tsx). Not
// persisted anywhere -- a refresh or revisit without that query param just
// doesn't render it again.
export function WelcomeBanner({ publicUrl }: { publicUrl: string }) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    await navigator.clipboard.writeText(publicUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="flex flex-col gap-3 rounded-xl border border-sky/30 bg-sky/5 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <p className="font-semibold text-navy">
          ¡Tu página está lista! Compartila con tus clientes.
        </p>
        <a
          href={publicUrl}
          target="_blank"
          rel="noreferrer"
          className="text-sm text-sky-dark underline"
        >
          {publicUrl}
        </a>
      </div>
      <button
        type="button"
        onClick={handleCopy}
        className="inline-flex shrink-0 items-center justify-center rounded-full border border-sky px-4 py-2 text-sm font-medium text-sky-dark transition-colors hover:bg-sky/10"
      >
        {copied ? "¡Copiado!" : "Copiar link"}
      </button>
    </div>
  );
}
