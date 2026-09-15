"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { FormFieldSchema, FormSchema } from "@/lib/forms/validate-form-data";
import { ROOT_DOMAIN } from "@/lib/root-domain";
import { checkSlugAvailabilityAction, createLandingAction } from "./actions";

export interface Profession {
  id: string;
  name: string;
  slug: string;
  form_schema: FormSchema;
}

export interface Template {
  id: string;
  profession_id: string;
  name: string;
  slug: string;
  preview_image_url: string | null;
}

export interface StockImage {
  id: string;
  category: string;
  image_url: string;
}

type Step = "profession" | "template" | "form" | "slug";

type SlugStatus =
  | { state: "checking" }
  | { state: "available" }
  | { state: "taken"; suggestions: string[] }
  | { state: "invalid"; message: string };

export function OnboardingWizard({
  professions,
  templates,
  stockImages,
}: {
  professions: Profession[];
  templates: Template[];
  stockImages: StockImage[];
}) {
  const router = useRouter();
  const [step, setStep] = useState<Step>("profession");
  const [professionId, setProfessionId] = useState<string | null>(null);
  const [templateId, setTemplateId] = useState<string | null>(null);
  const [values, setValues] = useState<Record<string, string>>({});
  const [imageMode, setImageMode] = useState<"stock" | "manual">("stock");
  const [slugInput, setSlugInput] = useState("");
  const [slugStatus, setSlugStatus] = useState<SlugStatus | null>(null);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const profession = professions.find((p) => p.id === professionId) ?? null;
  const professionTemplates = useMemo(
    () => templates.filter((t) => t.profession_id === professionId),
    [templates, professionId]
  );

  useEffect(() => {
    if (step !== "slug" || slugInput.trim().length === 0) {
      return;
    }
    const handle = setTimeout(async () => {
      setSlugStatus({ state: "checking" });
      const result = await checkSlugAvailabilityAction(slugInput);
      if (!result.valid) {
        setSlugStatus({ state: "invalid", message: result.message });
      } else if (result.available) {
        setSlugStatus({ state: "available" });
      } else {
        setSlugStatus({ state: "taken", suggestions: result.suggestions });
      }
    }, 500);
    return () => clearTimeout(handle);
  }, [slugInput, step]);

  function updateValue(key: string, value: string) {
    setValues((v) => ({ ...v, [key]: value }));
  }

  function handleSubmit() {
    if (!professionId || !templateId) return;
    setSubmitError(null);
    setFormErrors({});
    startTransition(async () => {
      const result = await createLandingAction({
        professionId,
        templateId,
        formData: values,
        desiredSlug: slugInput,
      });

      if (result.ok) {
        router.push("/dashboard");
        return;
      }

      switch (result.reason) {
        case "invalid_form_data":
          setFormErrors(result.errors);
          setStep("form");
          break;
        case "slug_taken":
          setSlugStatus({ state: "taken", suggestions: result.suggestions });
          break;
        case "invalid_slug":
          setSlugStatus({ state: "invalid", message: result.message });
          break;
        case "already_has_landing":
          router.push("/dashboard");
          break;
        default:
          setSubmitError("No se pudo crear la landing. Intentá de nuevo.");
      }
    });
  }

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-8 px-6 py-12">
      <Steps current={step} />

      {step === "profession" && (
        <section className="flex flex-col gap-4">
          <h2 className="text-xl font-semibold">Elegí tu profesión</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            {professions.map((p) => (
              <button
                key={p.id}
                onClick={() => {
                  setProfessionId(p.id);
                  setTemplateId(null);
                  setStep("template");
                }}
                className="rounded-xl border border-black/[.08] p-6 text-left hover:border-black/30 dark:border-white/[.145] dark:hover:border-white/40"
              >
                <span className="text-lg font-medium">{p.name}</span>
              </button>
            ))}
          </div>
        </section>
      )}

      {step === "template" && profession && (
        <section className="flex flex-col gap-4">
          <h2 className="text-xl font-semibold">Elegí una plantilla</h2>
          <div className="grid gap-4 sm:grid-cols-3">
            {professionTemplates.map((t) => (
              <button
                key={t.id}
                onClick={() => {
                  setTemplateId(t.id);
                  setStep("form");
                }}
                className={`flex flex-col gap-2 rounded-xl border p-4 text-left ${
                  templateId === t.id
                    ? "border-black dark:border-white"
                    : "border-black/[.08] dark:border-white/[.145]"
                }`}
              >
                {t.preview_image_url && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={t.preview_image_url}
                    alt={t.name}
                    className="aspect-video w-full rounded-lg object-cover"
                  />
                )}
                <span className="font-medium">{t.name}</span>
              </button>
            ))}
          </div>
          <button
            onClick={() => setStep("profession")}
            className="self-start text-sm text-zinc-500 hover:underline"
          >
            Volver
          </button>
        </section>
      )}

      {step === "form" && profession && (
        <section className="flex flex-col gap-4">
          <h2 className="text-xl font-semibold">Completá tus datos</h2>
          {profession.form_schema.fields.map((field) => (
            <FieldInput
              key={field.key}
              field={field}
              value={values[field.key] ?? ""}
              error={formErrors[field.key]}
              onChange={(v) => updateValue(field.key, v)}
              imageMode={imageMode}
              onImageModeChange={setImageMode}
              stockImages={stockImages}
            />
          ))}
          {formErrors._form && (
            <p className="text-sm text-red-600">{formErrors._form}</p>
          )}
          <div className="flex gap-3">
            <button
              onClick={() => setStep("template")}
              className="rounded-full border border-black/[.08] px-5 py-2 text-sm dark:border-white/[.145]"
            >
              Volver
            </button>
            <button
              onClick={() => setStep("slug")}
              className="rounded-full bg-foreground px-5 py-2 text-sm text-background"
            >
              Continuar
            </button>
          </div>
        </section>
      )}

      {step === "slug" && (
        <section className="flex flex-col gap-4">
          <h2 className="text-xl font-semibold">Elegí tu subdominio</h2>
          <div className="flex items-center gap-2">
            <input
              value={slugInput}
              onChange={(e) => setSlugInput(e.target.value)}
              placeholder="ej: contadorjuanperez"
              className="flex-1 rounded-lg border border-black/[.08] px-3 py-2 dark:border-white/[.145] dark:bg-transparent"
            />
            <span className="text-sm text-zinc-500">.{ROOT_DOMAIN}</span>
          </div>

          {slugStatus && (
            <SlugFeedback status={slugStatus} onPick={setSlugInput} />
          )}

          {submitError && (
            <p className="text-sm text-red-600">{submitError}</p>
          )}

          <div className="flex gap-3">
            <button
              onClick={() => setStep("form")}
              className="rounded-full border border-black/[.08] px-5 py-2 text-sm dark:border-white/[.145]"
            >
              Volver
            </button>
            <button
              onClick={handleSubmit}
              disabled={isPending || slugStatus?.state !== "available"}
              className="rounded-full bg-foreground px-5 py-2 text-sm text-background disabled:opacity-40"
            >
              {isPending ? "Creando..." : "Crear landing"}
            </button>
          </div>
        </section>
      )}
    </div>
  );
}

function Steps({ current }: { current: Step }) {
  const steps: { key: Step; label: string }[] = [
    { key: "profession", label: "Profesión" },
    { key: "template", label: "Plantilla" },
    { key: "form", label: "Datos" },
    { key: "slug", label: "Subdominio" },
  ];
  return (
    <ol className="flex gap-4 text-sm text-zinc-500">
      {steps.map((s) => (
        <li
          key={s.key}
          className={
            s.key === current ? "font-semibold text-black dark:text-white" : ""
          }
        >
          {s.label}
        </li>
      ))}
    </ol>
  );
}

function FieldInput({
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

function SlugFeedback({
  status,
  onPick,
}: {
  status: SlugStatus;
  onPick: (slug: string) => void;
}) {
  if (status.state === "checking") {
    return (
      <p className="text-sm text-zinc-500">Comprobando disponibilidad...</p>
    );
  }
  if (status.state === "available") {
    return <p className="text-sm text-green-600">Disponible ✓</p>;
  }
  if (status.state === "invalid") {
    return <p className="text-sm text-red-600">{status.message}</p>;
  }
  return (
    <div className="text-sm text-red-600">
      <p>Ese subdominio ya está en uso. Alternativas:</p>
      <div className="mt-2 flex flex-wrap gap-2">
        {status.suggestions.map((s) => (
          <button
            key={s}
            onClick={() => onPick(s)}
            className="rounded-full border border-black/[.08] px-3 py-1 text-black dark:border-white/[.145] dark:text-white"
          >
            {s}
          </button>
        ))}
      </div>
    </div>
  );
}
