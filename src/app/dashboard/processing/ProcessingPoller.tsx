"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

const POLL_INTERVAL_MS = 3000;
const SLOW_AFTER_MS = 30000;

export function ProcessingPoller() {
  const router = useRouter();
  const [isSlow, setIsSlow] = useState(false);

  useEffect(() => {
    const startedAt = Date.now();
    let cancelled = false;
    let timeoutId: ReturnType<typeof setTimeout>;

    async function poll() {
      try {
        const res = await fetch("/api/landings/status", { cache: "no-store" });
        if (res.ok) {
          const data = await res.json();
          if (data.status === "active") {
            router.push("/dashboard");
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

  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-3 px-6 py-12 text-center">
      <h1 className="text-xl font-semibold">Procesando tu suscripción...</h1>
      <p className="text-zinc-500">
        Esto puede tardar unos segundos mientras confirmamos el pago con
        Mercado Pago.
      </p>
      {isSlow && (
        <p className="text-sm text-zinc-400">
          Está tardando más de lo normal. Podés cerrar esta pantalla, se va a
          activar sola apenas se confirme el pago.
        </p>
      )}
    </div>
  );
}
