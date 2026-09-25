"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

const POLL_INTERVAL_MS = 3000;
const SLOW_AFTER_MS = 30000;

// Payment statuses that will never resolve into an approval on their own --
// see mercadopago/client.ts's PaymentDetails.status. Anything else
// (pending, in_process, or no payment recorded yet) keeps polling.
const TERMINAL_FAILURE_STATUSES = new Set(["rejected", "cancelled"]);

export function ProcessingPoller({ fromCardBrick }: { fromCardBrick?: boolean }) {
  const router = useRouter();
  const [isSlow, setIsSlow] = useState(false);
  const [rejected, setRejected] = useState(false);

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
            router.push("/dashboard?bienvenida=1");
            return;
          }
          // Landing status alone never tells us a charge was declined (it
          // only ever moves forward on approval) -- without checking the
          // payment's own status here, a rejected card would poll this
          // screen forever under the false "just wait, it'll activate"
          // message below.
          if (data.paymentStatus && TERMINAL_FAILURE_STATUSES.has(data.paymentStatus)) {
            setRejected(true);
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

  if (rejected) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-3 px-6 py-12 text-center">
        <h1 className="text-xl font-semibold">No pudimos procesar tu pago</h1>
        <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm font-medium text-red-700">
          Tu tarjeta fue rechazada. No se te realizó ningún cobro.
        </p>
        <p className="text-sm text-zinc-500">
          Volvé a tu panel para intentar de nuevo con otra tarjeta.
        </p>
        <Link
          href="/dashboard"
          className="inline-flex min-h-11 items-center justify-center rounded-full bg-sky px-5 text-sm font-semibold text-white transition-colors hover:bg-sky-dark"
        >
          Volver al panel
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-3 px-6 py-12 text-center">
      <h1 className="text-xl font-semibold">Procesando tu suscripción...</h1>
      <p className="text-zinc-500">
        {fromCardBrick
          ? "Tu suscripción fue procesada. El primer cobro puede tardar hasta 1 hora en confirmarse."
          : "Esto puede tardar unos segundos mientras confirmamos el pago con Mercado Pago."}
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
