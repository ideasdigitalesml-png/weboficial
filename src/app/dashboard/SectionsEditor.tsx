"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { SectionConfigItem } from "@/lib/landings/update-landing";
import { updateLandingSectionsConfigAction } from "./actions";

const SECTION_LABELS: Record<string, string> = {
  hero: "Portada",
  about: "Sobre mí",
  services: "Servicios",
  contact: "Contacto",
};

function sortedByOrder(sections: SectionConfigItem[]): SectionConfigItem[] {
  return [...sections].sort((a, b) => a.order - b.order);
}

// Re-numbers order as 1..N from the current array position -- the only
// thing the user can actually change here is that position and `visible`.
function renumber(sections: SectionConfigItem[]): SectionConfigItem[] {
  return sections.map((s, i) => ({ ...s, order: i + 1 }));
}

export function SectionsEditor({
  landingId,
  initialSections,
}: {
  landingId: string;
  initialSections: SectionConfigItem[];
}) {
  const router = useRouter();
  const [sections, setSections] = useState<SectionConfigItem[]>(
    sortedByOrder(initialSections)
  );
  const [error, setError] = useState<string | null>(null);
  const [savedAt, setSavedAt] = useState<number | null>(null);
  const [isPending, startTransition] = useTransition();

  function move(index: number, direction: -1 | 1) {
    const target = index + direction;
    if (target < 0 || target >= sections.length) return;
    const next = [...sections];
    [next[index], next[target]] = [next[target], next[index]];
    setSections(renumber(next));
    setSavedAt(null);
  }

  function toggleVisible(id: string) {
    setSections((prev) =>
      prev.map((s) => (s.id === id ? { ...s, visible: !s.visible } : s))
    );
    setSavedAt(null);
  }

  function handleSave() {
    setError(null);
    startTransition(async () => {
      const result = await updateLandingSectionsConfigAction(
        landingId,
        sections
      );
      if (result.ok) {
        setSections(sortedByOrder(result.sectionsConfig));
        setSavedAt(Date.now());
        router.refresh();
        return;
      }
      setError(
        result.reason === "invalid_sections_config"
          ? result.message
          : "No se pudo guardar. Intentá de nuevo."
      );
    });
  }

  return (
    <div className="flex flex-col gap-3">
      <h2 className="text-lg font-semibold">Secciones de mi landing</h2>
      <ul className="flex flex-col gap-2">
        {sections.map((section, index) => (
          <li
            key={section.id}
            className="flex items-center gap-3 rounded-lg border border-black/[.08] px-3 py-2 dark:border-white/[.145]"
          >
            <div className="flex flex-col">
              <button
                type="button"
                onClick={() => move(index, -1)}
                disabled={index === 0}
                aria-label="Subir"
                className="disabled:opacity-30"
              >
                ▲
              </button>
              <button
                type="button"
                onClick={() => move(index, 1)}
                disabled={index === sections.length - 1}
                aria-label="Bajar"
                className="disabled:opacity-30"
              >
                ▼
              </button>
            </div>
            <span className="flex-1 text-sm">
              {SECTION_LABELS[section.id] ?? section.id}
            </span>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={section.visible}
                onChange={() => toggleVisible(section.id)}
              />
              Visible
            </label>
          </li>
        ))}
      </ul>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={handleSave}
          disabled={isPending}
          className="self-start rounded-full bg-foreground px-5 py-2 text-sm text-background disabled:opacity-40"
        >
          {isPending ? "Guardando..." : "Guardar secciones"}
        </button>
        {savedAt && <span className="text-sm text-green-600">Guardado ✓</span>}
      </div>
    </div>
  );
}
