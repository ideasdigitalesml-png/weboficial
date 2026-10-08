"use client";

import { useState, useTransition } from "react";
import { TurnosConfigEditor } from "@/components/turnos/TurnosConfigEditor";
import type { TurnosConfig } from "@/lib/turnos/types";
import { updateLandingTurnosConfigAction } from "../actions";

export function TurnosPageClient({
  landingId,
  initialConfig,
}: {
  landingId: string;
  initialConfig: TurnosConfig;
}) {
  const [config, setConfig] = useState(initialConfig);
  const [isPending, startTransition] = useTransition();
  const [toast, setToast] = useState<"saved" | "error" | null>(null);

  function handleSave() {
    startTransition(async () => {
      const result = await updateLandingTurnosConfigAction(landingId, config);
      if (result.ok) {
        setConfig(result.turnosConfig);
        setToast("saved");
      } else {
        setToast("error");
      }
      setTimeout(() => setToast(null), 4000);
    });
  }

  return (
    <div className="flex flex-col gap-6">
      <TurnosConfigEditor value={config} onChange={setConfig} />

      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={handleSave}
          disabled={isPending}
          className="inline-flex min-h-11 items-center justify-center rounded-full bg-sky px-5 text-sm font-semibold text-white transition-colors hover:bg-sky-dark disabled:opacity-40"
        >
          {isPending ? "Guardando..." : "Guardar cambios"}
        </button>
        {toast === "saved" && (
          <span className="text-sm font-medium text-emerald-600">Guardado ✓</span>
        )}
        {toast === "error" && (
          <span className="text-sm font-medium text-red-600">
            No se pudo guardar. Intentá de nuevo.
          </span>
        )}
      </div>
    </div>
  );
}
