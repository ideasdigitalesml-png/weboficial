"use client";

// Shared by the dashboard's Personalización section and the Contador
// wizard's "paleta" step -- both need the exact same 2x2/4-across grid of
// swatch cards, just wired to different state.
export interface PaletaOption {
  id: string;
  nombre: string;
  preview: readonly [string, string, string];
}

export function PaletteSelector({
  paletas,
  selectedId,
  onSelect,
}: {
  paletas: readonly PaletaOption[];
  selectedId: string;
  onSelect: (id: string) => void;
}) {
  return (
    <div
      role="radiogroup"
      aria-label="Paleta de colores"
      className="grid grid-cols-2 gap-3 sm:grid-cols-4"
    >
      {paletas.map((paleta) => {
        const isSelected = paleta.id === selectedId;
        return (
          <button
            key={paleta.id}
            type="button"
            role="radio"
            aria-checked={isSelected}
            onClick={() => onSelect(paleta.id)}
            className={`flex flex-col items-center gap-2 rounded-xl border-2 px-3 py-4 transition-colors ${
              isSelected
                ? "border-sky bg-sky/5"
                : "border-border-subtle hover:border-navy/30"
            }`}
          >
            <div className="flex items-center gap-1.5">
              {paleta.preview.map((color, i) => (
                <span
                  key={i}
                  className="h-6 w-6 rounded-full border border-black/[.08]"
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>
            <span className="text-sm font-medium text-navy">
              {paleta.nombre}
            </span>
          </button>
        );
      })}
    </div>
  );
}
