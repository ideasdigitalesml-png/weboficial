"use client";

import { useActionState, useState } from "react";
import Image from "next/image";
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
    <div className="flex flex-col gap-3">
      <div className="flex flex-col gap-3 sm:hidden">
        <form action={formAction}>
          <button
            type="submit"
            disabled={isPending}
            className="inline-flex min-h-[52px] w-full items-center justify-center gap-2 rounded-xl border border-border-subtle bg-white px-5 text-base font-semibold text-navy transition-colors hover:border-navy/40 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <Image
              src="/icons/mercadopago.svg"
              alt=""
              aria-hidden
              width={110}
              height={24}
              className="h-5 w-auto"
            />
            {isPending ? "Redirigiendo..." : "Pagar con Mercado Pago"}
          </button>
        </form>

        {!state.ok && <p className="text-sm text-red-600">{state.message}</p>}

        {!showCardForm && (
          <button
            type="button"
            onClick={() => setCardFormOpen(true)}
            className="self-start text-sm text-sky-dark underline"
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
