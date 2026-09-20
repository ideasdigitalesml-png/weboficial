"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { FormSchema, FormFieldValue } from "@/lib/forms/validate-form-data";
import { FieldInput, type StockImage } from "@/components/forms/FieldInput";
import { updateLandingFormDataAction } from "./actions";

export function EditLandingForm({
  landingId,
  formSchema,
  initialValues,
  stockImages,
  onDirtyChange,
  onSaved,
}: {
  landingId: string;
  formSchema: FormSchema;
  initialValues: Record<string, FormFieldValue>;
  stockImages: StockImage[];
  onDirtyChange?: (dirty: boolean) => void;
  onSaved?: () => void;
}) {
  const router = useRouter();
  const [values, setValues] = useState<Record<string, FormFieldValue>>(
    initialValues
  );
  const [imageMode, setImageMode] = useState<"stock" | "manual">("stock");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [savedAt, setSavedAt] = useState<number | null>(null);
  const [isPending, startTransition] = useTransition();

  function updateValue(key: string, value: FormFieldValue) {
    setValues((v) => {
      const next = { ...v, [key]: value };
      onDirtyChange?.(JSON.stringify(next) !== JSON.stringify(initialValues));
      return next;
    });
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrors({});
    setSavedAt(null);
    startTransition(async () => {
      const result = await updateLandingFormDataAction(landingId, values);
      if (result.ok) {
        setValues(result.formData);
        setSavedAt(Date.now());
        onDirtyChange?.(false);
        onSaved?.();
        router.refresh();
        return;
      }
      if (result.reason === "invalid_form_data") {
        setErrors(result.errors);
      } else if (result.reason === "not_found") {
        setErrors({ _form: "No se encontró tu landing." });
      } else {
        setErrors({ _form: "No se pudo guardar. Intentá de nuevo." });
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <h2 className="text-lg font-semibold">Editar mis datos</h2>
      {formSchema.fields.map((field) => (
        <FieldInput
          key={field.key}
          field={field}
          value={values[field.key] ?? ""}
          error={errors[field.key]}
          onChange={(v) => updateValue(field.key, v)}
          imageMode={imageMode}
          onImageModeChange={setImageMode}
          stockImages={stockImages}
        />
      ))}
      {errors._form && <p className="text-sm text-red-600">{errors._form}</p>}
      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={isPending}
          className="self-start rounded-full bg-foreground px-5 py-2 text-sm text-background disabled:opacity-40"
        >
          {isPending ? "Guardando..." : "Guardar cambios"}
        </button>
        {savedAt && (
          <span className="text-sm text-green-600">Guardado ✓</span>
        )}
      </div>
    </form>
  );
}
