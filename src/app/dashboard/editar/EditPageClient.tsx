"use client";

import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import type { FormSchema, FormFieldValue } from "@/lib/forms/validate-form-data";
import type { StockImage } from "@/components/forms/FieldInput";
import type { SectionConfigItem } from "@/lib/landings/update-landing";
import { EditLandingForm } from "../EditLandingForm";
import { SectionsEditor } from "../SectionsEditor";

export function EditPageClient({
  landingId,
  formSchema,
  initialValues,
  stockImages,
  initialSections,
  publicUrl,
}: {
  landingId: string;
  formSchema: FormSchema;
  initialValues: Record<string, FormFieldValue>;
  stockImages: StockImage[];
  initialSections: SectionConfigItem[];
  publicUrl: string;
}) {
  const router = useRouter();
  const [formDirty, setFormDirty] = useState(false);
  const [sectionsDirty, setSectionsDirty] = useState(false);
  const [toast, setToast] = useState(false);

  const showToast = useCallback(() => {
    setToast(true);
    setTimeout(() => setToast(false), 4000);
  }, []);

  function handleCancel() {
    if (formDirty || sectionsDirty) {
      const confirmed = window.confirm("¿Salir sin guardar?");
      if (!confirmed) return;
    }
    router.push("/dashboard");
  }

  return (
    <div className="flex flex-col gap-8">
      <nav className="text-sm text-text-body">
        <a href="/dashboard" className="underline hover:text-navy">
          Dashboard
        </a>
        {" → "}
        <span className="text-navy">Editar mi página</span>
      </nav>

      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-navy">Editá tu página</h1>
        <button
          type="button"
          onClick={handleCancel}
          className="rounded-full border border-border-subtle px-4 py-1.5 text-sm font-medium text-navy transition-colors hover:border-navy/40"
        >
          Cancelar
        </button>
      </div>

      {toast && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
          ¡Cambios guardados! Tu página ya está actualizada.{" "}
          <a href={publicUrl} target="_blank" rel="noreferrer" className="underline">
            Ver mi página
          </a>
        </div>
      )}

      <EditLandingForm
        landingId={landingId}
        formSchema={formSchema}
        initialValues={initialValues}
        stockImages={stockImages}
        onDirtyChange={setFormDirty}
        onSaved={showToast}
      />

      <SectionsEditor
        landingId={landingId}
        initialSections={initialSections}
        onDirtyChange={setSectionsDirty}
        onSaved={showToast}
      />
    </div>
  );
}
