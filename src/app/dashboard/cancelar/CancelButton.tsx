"use client";

import { useState, useTransition } from "react";
import { cancelSubscriptionAction } from "../actions";

export function CancelButton() {
  const [message, setMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleConfirm() {
    setMessage(null);
    startTransition(async () => {
      const result = await cancelSubscriptionAction();
      setMessage(result.message);
    });
  }

  return (
    <div className="flex flex-col gap-3">
      <button
        type="button"
        onClick={handleConfirm}
        disabled={isPending}
        className="inline-flex min-h-11 items-center justify-center self-start rounded-full bg-red-600 px-6 text-sm font-semibold text-white transition-colors hover:bg-red-700 disabled:opacity-40"
      >
        {isPending ? "Procesando..." : "Confirmar cancelación"}
      </button>
      {message && <p className="text-sm text-red-600">{message}</p>}
    </div>
  );
}
