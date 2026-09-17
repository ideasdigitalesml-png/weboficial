"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Wordmark } from "@/components/landing/Wordmark";
import { publishDraftPage } from "../publish-draft";
import { PRIMARY_BUTTON, SECONDARY_BUTTON } from "../styles";

type ViewState =
  | { kind: "working" }
  | { kind: "error"; message: string };

export function PublishingClient() {
  const router = useRouter();
  const [view, setView] = useState<ViewState>({ kind: "working" });
  const [isPending, startTransition] = useTransition();

  function doPublish() {
    startTransition(async () => {
      const outcome = await publishDraftPage();

      switch (outcome.status) {
        case "no_draft":
          // Nothing to publish (e.g. a direct visit to this URL) -- back
          // to the form.
          router.replace("/onboarding");
          return;
        case "already_has_landing":
          router.replace("/dashboard");
          return;
        case "create_failed":
        case "subscribe_failed":
          setView({ kind: "error", message: outcome.message });
          return;
      }
    });
  }

  function handleRetry() {
    setView({ kind: "working" });
    doPublish();
  }

  useEffect(() => {
    doPublish();
    // Only ever runs once on mount -- retries are user-triggered via
    // handleRetry().
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="flex min-h-full flex-1 flex-col bg-white">
      <header className="border-b border-border-subtle px-6 py-4">
        <Wordmark className="text-lg" />
      </header>
      <div className="mx-auto flex w-full max-w-sm flex-1 flex-col items-center justify-center gap-4 px-6 py-16 text-center">
        {view.kind === "working" || isPending ? (
          <>
            <h1 className="text-lg font-semibold text-navy">
              Publicando tu página...
            </h1>
            <p className="text-sm text-text-body">
              Esto toma solo un momento. No cierres esta pestaña.
            </p>
          </>
        ) : (
          <>
            <h1 className="text-lg font-semibold text-navy">
              No pudimos publicar tu página
            </h1>
            <p className="text-sm text-red-600">{view.message}</p>
            <div className="mt-2 flex w-full flex-col gap-2">
              <button onClick={handleRetry} className={PRIMARY_BUTTON}>
                Reintentar
              </button>
              <Link href="/onboarding" className={SECONDARY_BUTTON}>
                Volver al formulario
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
