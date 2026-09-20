"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { PaletteSelector, type PaletaOption } from "@/components/templates/PaletteSelector";
import { updateLandingPaletaAction } from "./actions";

export function PaletteEditor({
  landingId,
  paletas,
  initialPaletaId,
}: {
  landingId: string;
  paletas: readonly PaletaOption[];
  initialPaletaId: string;
}) {
  const router = useRouter();
  const [selectedId, setSelectedId] = useState(initialPaletaId);
  const [savedId, setSavedId] = useState(initialPaletaId);
  const [error, setError] = useState<string | null>(null);
  const [savedAt, setSavedAt] = useState<number | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSave() {
    setError(null);
    setSavedAt(null);
    startTransition(async () => {
      const result = await updateLandingPaletaAction(landingId, selectedId);
      if (result.ok) {
        setSavedId(result.paletaId);
        setSavedAt(Date.now());
        router.refresh();
        return;
      }
      setError(
        result.reason === "invalid_paleta"
          ? "Esa paleta no está disponible para tu plantilla."
          : "No se pudo guardar. Intentá de nuevo."
      );
    });
  }

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h2 className="text-lg font-semibold text-navy">Personalización</h2>
        <p className="text-sm text-text-body">Elegí el estilo de colores de tu página.</p>
      </div>
      <PaletteSelector paletas={paletas} selectedId={selectedId} onSelect={setSelectedId} />
      {error && <p className="text-sm text-red-600">{error}</p>}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={handleSave}
          disabled={isPending || selectedId === savedId}
          className="self-start rounded-full bg-foreground px-5 py-2 text-sm text-background disabled:opacity-40"
        >
          {isPending ? "Guardando..." : "Guardar cambios de color"}
        </button>
        {savedAt && <span className="text-sm text-green-600">Guardado ✓</span>}
      </div>
    </div>
  );
}
