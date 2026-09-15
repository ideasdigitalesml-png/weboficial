"use client";

import type { FormFieldSchema } from "@/lib/forms/validate-form-data";

export interface StockImage {
  id: string;
  category: string;
  image_url: string;
}

export function FieldInput({
  field,
  value,
  error,
  onChange,
  imageMode,
  onImageModeChange,
  stockImages,
}: {
  field: FormFieldSchema;
  value: string;
  error?: string;
  onChange: (value: string) => void;
  imageMode: "stock" | "manual";
  onImageModeChange: (mode: "stock" | "manual") => void;
  stockImages: StockImage[];
}) {
  if (field.type === "image") {
    return (
      <div className="flex flex-col gap-2">
        <label className="text-sm font-medium">{field.label}</label>
        <div className="flex gap-2 text-sm">
          <button
            type="button"
            onClick={() => onImageModeChange("stock")}
            className={
              imageMode === "stock" ? "font-semibold underline" : "text-zinc-500"
            }
          >
            Elegir de la galería
          </button>
          <button
            type="button"
            onClick={() => onImageModeChange("manual")}
            className={
              imageMode === "manual" ? "font-semibold underline" : "text-zinc-500"
            }
          >
            Pegar URL
          </button>
        </div>
        {imageMode === "stock" ? (
          <div className="grid grid-cols-4 gap-2 sm:grid-cols-6">
            {stockImages.map((img) => (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                key={img.id}
                src={img.image_url}
                alt=""
                onClick={() => onChange(img.image_url)}
                className={`aspect-square cursor-pointer rounded-full object-cover ${
                  value === img.image_url
                    ? "ring-2 ring-black dark:ring-white"
                    : ""
                }`}
              />
            ))}
          </div>
        ) : (
          <input
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder="https://..."
            className="rounded-lg border border-black/[.08] px-3 py-2 dark:border-white/[.145] dark:bg-transparent"
          />
        )}
        {error && <p className="text-sm text-red-600">{error}</p>}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      <label className="text-sm font-medium">{field.label}</label>
      {field.type === "textarea" ? (
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          rows={4}
          className="rounded-lg border border-black/[.08] px-3 py-2 dark:border-white/[.145] dark:bg-transparent"
        />
      ) : (
        <input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          type={field.type === "email" ? "email" : "text"}
          className="rounded-lg border border-black/[.08] px-3 py-2 dark:border-white/[.145] dark:bg-transparent"
        />
      )}
      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  );
}
