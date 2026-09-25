"use client";

import { useState, useTransition } from "react";
import { setResellerStatusAction } from "./actions";
import type { AdminResellerListItem } from "@/lib/admin/reseller-queries";

export function ResellerList({ resellers }: { resellers: AdminResellerListItem[] }) {
  const [isPending, startTransition] = useTransition();
  const [pendingId, setPendingId] = useState<string | null>(null);

  function toggleStatus(id: string, currentStatus: string) {
    const next = currentStatus === "active" ? "inactive" : "active";
    setPendingId(id);
    startTransition(async () => {
      try {
        await setResellerStatusAction(id, next);
      } finally {
        setPendingId(null);
      }
    });
  }

  if (resellers.length === 0) {
    return <p className="text-sm text-zinc-500">Todavía no hay revendedores.</p>;
  }

  return (
    <table className="w-full text-left text-sm">
      <thead>
        <tr className="border-b border-black/[.08] text-zinc-500 dark:border-white/[.145]">
          <th className="py-2 pr-4">Nombre</th>
          <th className="py-2 pr-4">Email</th>
          <th className="py-2 pr-4">Código</th>
          <th className="py-2 pr-4">Clientes activos</th>
          <th className="py-2 pr-4">Comisiones generadas</th>
          <th className="py-2 pr-4">Estado</th>
          <th className="py-2 pr-4"></th>
        </tr>
      </thead>
      <tbody>
        {resellers.map((r) => (
          <tr key={r.id} className="border-b border-black/[.04] dark:border-white/[.08]">
            <td className="py-2 pr-4">{r.name}</td>
            <td className="py-2 pr-4">{r.email}</td>
            <td className="py-2 pr-4">{r.referralCode}</td>
            <td className="py-2 pr-4">{r.activeClients}</td>
            <td className="py-2 pr-4">${r.totalCommissions.toLocaleString("es-AR")}</td>
            <td className="py-2 pr-4">{r.status === "active" ? "Activo" : "Inactivo"}</td>
            <td className="py-2 pr-4">
              <button
                type="button"
                disabled={isPending && pendingId === r.id}
                onClick={() => toggleStatus(r.id, r.status)}
                className="text-blue-600 underline disabled:opacity-50 dark:text-blue-400"
              >
                {r.status === "active" ? "Desactivar" : "Reactivar"}
              </button>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
