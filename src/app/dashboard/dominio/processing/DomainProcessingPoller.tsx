"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

const POLL_INTERVAL_MS = 3000;
const SLOW_AFTER_MS = 30000;

// Same shape as src/app/dashboard/processing/ProcessingPoller.tsx, polling
// /api/domains/status instead -- registration + Vercel DNS wiring happen
// in the webhook (see handleDomainPaymentEvent), this just waits for that
// to land.
export function DomainProcessingPoller() {
  const router = useRouter();
  const [isSlow, setIsSlow] = useState(false);
  const [failureReason, setFailureReason] = useState<string | null>(null);

  useEffect(() => {
    const startedAt = Date.now();
    let cancelled = false;
    let timeoutId: ReturnType<typeof setTimeout>;

    async function poll() {
      try {
        const res = await fetch("/api/domains/status", { cache: "no-store" });
        if (res.ok) {
          const data = await res.json();
          if (data.status === "active") {
            router.push("/dashboard");
            return;
          }
          if (data.status === "failed") {
            setFailureReason(data.failureReason ?? "No se pudo registrar el dominio.");
            return;
          }
        }
      } catch {
        // network hiccup: keep polling
      }
      if (!cancelled) {
        if (Date.now() - startedAt > SLOW_AFTER_MS) setIsSlow(true);
        timeoutId = setTimeout(poll, POLL_INTERVAL_MS);
      }
    }

    poll();
    return () => {
      cancelled = true;
      clearTimeout(timeoutId);
    };
  }, [router]);

  if (failureReason) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-3 px-6 py-12 text-center">
        <h1 className="text-xl font-semibold text-navy">No pudimos registrar tu dominio</h1>
        <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm font-medium text-red-700">
          {failureReason}
        </p>
        <p className="text-sm text-text-body">
          Ya recibimos tu pago. Escribinos a ideasdigitalesml@gmail.com para resolverlo.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-3 px-6 py-12 text-center">
      <h1 className="text-xl font-semibold text-navy">Registrando tu dominio...</h1>
      <p className="text-text-body">
        Estamos confirmando el pago y activando el DNS. Esto puede tardar unos minutos.
      </p>
      {isSlow && (
        <p className="text-sm text-text-body/70">
          Está tardando más de lo normal. Podés cerrar esta pantalla, se va a activar solo apenas
          esté listo.
        </p>
      )}
    </div>
  );
}
