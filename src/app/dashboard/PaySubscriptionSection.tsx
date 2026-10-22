"use client";

import { useActionState, useState } from "react";
import { createSubscriptionAction } from "./actions";
import { CardPaymentBrick } from "@/components/CardPaymentBrick";

type SubscribeState = { ok: true } | { ok: false; message: string };
const initialState: SubscribeState = { ok: true };

// Mobile-only redirect to Mercado Pago's hosted checkout (init_point) --
// opens the MP app directly on a phone that has it installed, same as
// this flow worked before CardPaymentBrick replaced it for everyone.
// Reinstated for mobile only: desktop keeps CardPaymentBrick exactly as it
// is today, only one <CardPaymentBrick> instance ever mounts (the div
// below toggles visibility via className, not a second mount), so this
// never double-fires MP's init script.
//
// createSubscriptionAction's own redirect() never returns on success --
// reaching the `!state.ok` branch only happens on failure. The
// `<form action={formAction}>` + useActionState pairing (not a plain
// onClick) is what makes that redirect work for an *external* (non-
// weboficial) URL -- it's the same mechanism the pre-Brick SubscribeButton
// used.
//
// Carries its own id ("pagar-y-activar") so other pages/banners can link
// here with a plain `#pagar-y-activar` anchor (smooth scroll, no extra JS)
// instead of navigating to a whole other route. No official Mercado Pago
// SVG wordmark/icon exists in this repo -- the previous version faked one
// with two <text> elements, which is exactly what made the button's text
// wrap to 2 lines. Text-only per product decision, not recreated as a
// pseudo-logo.
export function PaySubscriptionSection({
  landingId,
  amount,
  payerEmail,
}: {
  landingId: string;
  amount: number;
  payerEmail: string;
}) {
  const [state, formAction, isPending] = useActionState<SubscribeState>(
    () => createSubscriptionAction(),
    initialState
  );
  const [cardFormOpen, setCardFormOpen] = useState(false);

  const showCardForm = cardFormOpen || !state.ok;

  return (
    <div
      id="pagar-y-activar"
      className="flex scroll-mt-20 flex-col gap-3 rounded-xl border border-border-subtle p-4"
    >
      <p className="text-sm font-medium text-navy">
        Activá tu página — ${amount.toLocaleString("es-AR")}/mes
      </p>

      <div className="flex flex-col gap-3 sm:hidden">
        <form action={formAction}>
          <button
            type="submit"
            disabled={isPending}
            className="inline-flex h-14 w-full items-center justify-center rounded-full bg-[#009EE3] px-5 text-base font-bold whitespace-nowrap text-white transition-colors hover:bg-[#0089C7] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isPending ? "Redirigiendo..." : "Pagar con Mercado Pago"}
          </button>
        </form>

        <p className="text-center text-xs text-text-body/60">
          Pago seguro con Mercado Pago · Cancelás cuando quieras
        </p>

        {!state.ok && <p className="text-sm text-red-600">{state.message}</p>}

        {!showCardForm && (
          <button
            type="button"
            onClick={() => setCardFormOpen(true)}
            className="inline-flex min-h-11 items-center justify-center self-center px-2 text-sm text-text-body/70 underline"
          >
            Prefiero cargar mi tarjeta acá
          </button>
        )}
      </div>

      <div className={showCardForm ? "block" : "hidden sm:block"}>
        <CardPaymentBrick landingId={landingId} amount={amount} payerEmail={payerEmail} />
      </div>
    </div>
  );
}
