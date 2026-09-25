"use client";

import { useState, useTransition } from "react";
import { approvePayoutAction } from "./actions";
import type { AdminPayoutRequestItem } from "@/lib/admin/reseller-queries";

export function PayoutRequestList({ requests }: { requests: AdminPayoutRequestItem[] }) {
  const [isPending, startTransition] = useTransition();
  const [pendingId, setPendingId] = useState<string | null>(null);

  function approve(id: string) {
    setPendingId(id);
    startTransition(async () => {
      try {
        await approvePayoutAction(id);
      } finally {
        setPendingId(null);
      }
    });
  }

  if (requests.length === 0) {
    return <p className="text-sm text-zinc-500">No hay solicitudes de pago pendientes.</p>;
  }

  return (
    <table className="w-full text-left text-sm">
      <thead>
        <tr className="border-b border-black/[.08] text-zinc-500 dark:border-white/[.145]">
          <th className="py-2 pr-4">Revendedor</th>
          <th className="py-2 pr-4">Monto</th>
          <th className="py-2 pr-4">CBU/Alias</th>
          <th className="py-2 pr-4">Fecha</th>
          <th className="py-2 pr-4"></th>
        </tr>
      </thead>
      <tbody>
        {requests.map((r) => (
          <tr key={r.id} className="border-b border-black/[.04] dark:border-white/[.08]">
            <td className="py-2 pr-4">{r.resellerName}</td>
            <td className="py-2 pr-4">${r.amount.toLocaleString("es-AR")}</td>
            <td className="py-2 pr-4">{r.cbuAlias}</td>
            <td className="py-2 pr-4">{new Date(r.requestedAt).toLocaleDateString("es-AR")}</td>
            <td className="py-2 pr-4">
              <button
                type="button"
                disabled={isPending && pendingId === r.id}
                onClick={() => approve(r.id)}
                className="text-blue-600 underline disabled:opacity-50 dark:text-blue-400"
              >
                Marcar como pagado
              </button>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
