"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { FormSchema } from "@/lib/forms/validate-form-data";
import { ROOT_DOMAIN } from "@/lib/root-domain";
import { FieldInput } from "@/components/forms/FieldInput";
import { Wordmark } from "@/components/landing/Wordmark";
import { checkSlugAvailabilityAction, createLandingAction } from "./actions";
import { ContadorWizard } from "./ContadorWizard";
import { AbogadoWizard } from "./AbogadoWizard";
import { PRIMARY_BUTTON, SECONDARY_BUTTON } from "./styles";

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
  config: {
    primaryColor?: string;
    secondaryColor?: string;
    layout?: string;
  } | null;
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

// Professions with a dedicated, richer wizard (own steps + live preview)
// instead of the generic form_schema-driven fallback below. The grid in
// the "profession" step still renders every row from the DB; the branch
// right below this set picks which wizard component to render for each.
const DEDICATED_WIZARD_PROFESSIONS = new Set(["contadores", "abogados"]);

export function OnboardingWizard({
  professions,
  templates,
  stockImages,
  isAuthenticated,
}: {
  professions: Profession[];
  templates: Template[];
  stockImages: StockImage[];
  isAuthenticated: boolean;
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
  const selectedTemplate =
    professionTemplates.find((t) => t.id === templateId) ?? null;
  const usesDedicatedWizard = Boolean(
    profession && DEDICATED_WIZARD_PROFESSIONS.has(profession.slug)
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
    <div className="flex min-h-full flex-1 flex-col bg-white">
      <WizardHeader />

      {step === "form" && profession && usesDedicatedWizard && selectedTemplate ? (
        profession.slug === "abogados" ? (
          <AbogadoWizard
            profession={profession}
            template={selectedTemplate}
            stockImages={stockImages}
            isAuthenticated={isAuthenticated}
            onBack={() => setStep("template")}
          />
        ) : (
          <ContadorWizard
            profession={profession}
            template={selectedTemplate}
            stockImages={stockImages}
            isAuthenticated={isAuthenticated}
            onBack={() => setStep("template")}
          />
        )
      ) : (
        <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-8 px-6 py-10">
          <Steps current={step} />

          {step === "profession" && (
            <section className="flex flex-col gap-4">
              <h2 className="text-xl font-semibold text-navy">
                Elegí tu profesión
              </h2>
              <div className="grid gap-5 sm:grid-cols-2">
                {professions.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => {
                      setProfessionId(p.id);
                      setTemplateId(null);
                      setStep("template");
                    }}
                    className="flex aspect-[4/3] flex-col justify-end gap-1 rounded-2xl border border-border-subtle bg-surface-muted p-6 text-left shadow-sm transition-colors hover:border-sky hover:bg-white"
                  >
                    <span className="text-xl font-semibold text-navy">
                      {p.name}
                    </span>
                    <span className="text-sm font-medium text-sky">Elegir</span>
                  </button>
                ))}
              </div>
            </section>
          )}

          {step === "template" && profession && (
            <section className="flex flex-col gap-4">
              <h2 className="text-xl font-semibold text-navy">
                Elegí una plantilla
              </h2>
              <div className="grid gap-5 sm:grid-cols-3">
                {professionTemplates.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => {
                      setTemplateId(t.id);
                      setStep("form");
                    }}
                    className={`flex flex-col gap-3 rounded-2xl border p-4 text-left shadow-sm transition-colors ${
                      templateId === t.id
                        ? "border-sky ring-2 ring-sky/20"
                        : "border-border-subtle hover:border-sky/50"
                    }`}
                  >
                    {t.preview_image_url && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={t.preview_image_url}
                        alt={t.name}
                        className="aspect-video w-full rounded-xl object-cover"
                      />
                    )}
                    <span className="text-lg font-medium text-navy">
                      {t.name}
                    </span>
                  </button>
                ))}
              </div>
              <button
                onClick={() => setStep("profession")}
                className="self-start text-sm font-medium text-text-body hover:text-navy hover:underline"
              >
                Volver
              </button>
            </section>
          )}

          {step === "form" && profession && (
            <section className="flex flex-col gap-4">
              <h2 className="text-xl font-semibold text-navy">
                Completá tus datos
              </h2>
              {profession.form_schema.fields.map((field) => (
                <FieldInput
                  key={field.key}
                  field={field}
                  value={values[field.key] ?? ""}
                  error={formErrors[field.key]}
                  onChange={(v) =>
                    updateValue(field.key, typeof v === "string" ? v : "")
                  }
                  imageMode={imageMode}
                  onImageModeChange={setImageMode}
                  stockImages={stockImages}
                />
              ))}
              {formErrors._form && (
                <p className="text-sm text-red-600">{formErrors._form}</p>
              )}
              <div className="flex gap-3">
                <button onClick={() => setStep("template")} className={SECONDARY_BUTTON}>
                  Volver
                </button>
                <button onClick={() => setStep("slug")} className={PRIMARY_BUTTON}>
                  Continuar
                </button>
              </div>
            </section>
          )}

          {step === "slug" && (
            <section className="flex flex-col gap-4">
              <h2 className="text-xl font-semibold text-navy">
                Elegí tu subdominio
              </h2>
              <div className="flex items-center gap-2">
                <input
                  value={slugInput}
                  onChange={(e) => setSlugInput(e.target.value)}
                  placeholder="ej: contadorjuanperez"
                  className="min-h-12 flex-1 rounded-lg border border-border-subtle bg-white px-3 py-2 text-navy focus:border-sky focus:outline-none focus:ring-2 focus:ring-sky/30"
                />
                <span className="text-sm text-text-body">.{ROOT_DOMAIN}</span>
              </div>

              {slugStatus && (
                <SlugFeedback status={slugStatus} onPick={setSlugInput} />
              )}

              {submitError && (
                <p className="text-sm text-red-600">{submitError}</p>
              )}

              <div className="flex gap-3">
                <button onClick={() => setStep("form")} className={SECONDARY_BUTTON}>
                  Volver
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={isPending || slugStatus?.state !== "available"}
                  className={PRIMARY_BUTTON}
                >
                  {isPending ? "Creando..." : "Crear landing"}
                </button>
              </div>
            </section>
          )}
        </div>
      )}
    </div>
  );
}

function WizardHeader() {
  return (
    <header className="border-b border-border-subtle px-6 py-4">
      <Wordmark className="text-lg" />
    </header>
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
    <ol className="flex gap-4 text-sm text-text-body">
      {steps.map((s) => (
        <li
          key={s.key}
          className={s.key === current ? "font-semibold text-navy" : ""}
        >
          {s.label}
        </li>
      ))}
    </ol>
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
      <p className="text-sm text-text-body">Comprobando disponibilidad...</p>
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
            className="min-h-9 rounded-full border border-border-subtle px-3 text-navy"
          >
            {s}
          </button>
        ))}
      </div>
    </div>
  );
}
