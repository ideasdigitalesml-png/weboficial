"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { requestPayoutAction } from "./actions";
import type { PendingPayoutRequest } from "@/lib/resellers/queries";

const PAYOUT_STATUS_LABELS: Record<string, string> = {
  pending: "Pendiente de pago",
  paid: "Pagada",
  rejected: "Rechazada",
};

function formatMoney(amount: number): string {
  return `$${amount.toLocaleString("es-AR")}`;
}

export function PayoutSection({
  pendingBalance,
  cbuAlias,
  pendingPayoutRequest,
}: {
  pendingBalance: number;
  cbuAlias: string | null;
  pendingPayoutRequest: PendingPayoutRequest | null;
}) {
  const router = useRouter();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [cbuInput, setCbuInput] = useState(cbuAlias ?? "");
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canRequest = pendingBalance > 0 && !pendingPayoutRequest;

  async function handleConfirm() {
    setIsPending(true);
    setError(null);
    const result = await requestPayoutAction(cbuInput);
    setIsPending(false);
    if (!result.ok) {
      setError(result.message);
      return;
    }
    setIsModalOpen(false);
    router.refresh();
  }

  return (
    <section className="flex flex-col gap-3">
      <h2 className="text-lg font-semibold text-navy">Solicitar cobro</h2>
      <div className="flex flex-col gap-3 rounded-xl border border-border-subtle p-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs text-text-body">Saldo disponible</p>
          <p className="text-xl font-semibold text-navy">{formatMoney(pendingBalance)}</p>
          {pendingPayoutRequest && (
            <p className="mt-1 text-xs text-amber-700">
              Solicitud de {formatMoney(pendingPayoutRequest.amount)}:{" "}
              {PAYOUT_STATUS_LABELS[pendingPayoutRequest.status] ?? pendingPayoutRequest.status}
            </p>
          )}
        </div>
        <button
          type="button"
          disabled={!canRequest}
          onClick={() => setIsModalOpen(true)}
          className={`inline-flex min-h-11 shrink-0 items-center justify-center rounded-full px-5 text-sm font-semibold text-white transition-colors ${
            canRequest ? "bg-sky hover:bg-sky-dark" : "pointer-events-none bg-sky/40"
          }`}
        >
          Solicitar Pago
        </button>
      </div>

      {isModalOpen && (
        <div
          className="fixed inset-0 z-[70] flex items-center justify-center bg-navy/40 px-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="payout-modal-title"
        >
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl">
            <h2 id="payout-modal-title" className="text-lg font-semibold text-navy">
              Solicitar pago
            </h2>
            <p className="mt-2 text-sm text-text-body">
              Vas a solicitar el cobro de {formatMoney(pendingBalance)}.
            </p>

            <label className="mt-4 flex flex-col gap-1.5 text-sm font-medium text-navy">
              CBU o alias
              <input
                type="text"
                value={cbuInput}
                onChange={(e) => setCbuInput(e.target.value)}
                placeholder="mi.alias.mp"
                className="min-h-11 rounded-lg border border-border-subtle px-3 text-base text-navy outline-none focus:border-sky"
              />
            </label>

            {error && <p className="mt-3 text-sm text-red-600">{error}</p>}

            <div className="mt-5 flex flex-col gap-2">
              <button
                type="button"
                onClick={handleConfirm}
                disabled={isPending || !cbuInput.trim()}
                className="inline-flex min-h-11 items-center justify-center rounded-full bg-sky px-5 text-sm font-semibold text-white transition-colors hover:bg-sky-dark disabled:opacity-50"
              >
                {isPending ? "Enviando..." : "Confirmar solicitud"}
              </button>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                disabled={isPending}
                className="inline-flex min-h-11 items-center justify-center rounded-full border border-border-subtle px-5 text-sm font-medium text-navy transition-colors hover:border-navy/40"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
