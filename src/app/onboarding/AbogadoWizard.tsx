"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { FormSchema, FormFieldValue } from "@/lib/forms/validate-form-data";
import { WHATSAPP_VALUE_RE } from "@/lib/whatsapp";
import { getSuggestedAbogadoText } from "@/lib/professions/abogados";
import { DEFAULT_SECTIONS_CONFIG } from "@/lib/landings/create-landing";
import { ROOT_DOMAIN } from "@/lib/root-domain";
import { FieldInput, type StockImage } from "@/components/forms/FieldInput";
import {
  AbogadoModernoTemplate,
  type AbogadoFormData,
} from "@/components/templates/abogado/AbogadoModernoTemplate";
import { AbogadoClasicoTemplate } from "@/components/templates/abogado/AbogadoClasicoTemplate";
import { AbogadoMinimalTemplate } from "@/components/templates/abogado/AbogadoMinimalTemplate";
import { checkSlugAvailabilityAction, createLandingAction } from "./actions";
import {
  PRIMARY_BUTTON,
  SECONDARY_BUTTON,
  TOGGLE_ACTIVE,
  TOGGLE_INACTIVE,
} from "./styles";
import { createSubscriptionAction } from "@/app/dashboard/actions";
import { saveDraftPage, loadDraftPage, clearDraftPage } from "./draft-storage";
import { AuthModal } from "./AuthModal";

const PUBLISHING_PATH = "/onboarding/publishing";
const DRAFT_SAVE_DEBOUNCE_MS = 300;

type AbogadoStep = "datos" | "contacto" | "servicios" | "sobre-mi" | "revision";

const STEP_ORDER: AbogadoStep[] = [
  "datos",
  "contacto",
  "servicios",
  "sobre-mi",
  "revision",
];

const STEP_LABELS: Record<AbogadoStep, string> = {
  datos: "Tus datos",
  contacto: "Contacto",
  servicios: "Áreas de práctica",
  "sobre-mi": "Sobre mí",
  revision: "Revisión y publicación",
};

// Which step owns each form_schema field -- used to route server-side
// validation errors (returned by key) back to the right step.
const FIELD_STEP: Record<string, AbogadoStep> = {
  name: "datos",
  matricula_numero: "datos",
  matricula_colegio: "datos",
  profile_image: "datos",
  phone: "contacto",
  email: "contacto",
  direccion: "contacto",
  ciudad: "contacto",
  provincia: "contacto",
  linkedin_url: "contacto",
  servicios: "servicios",
  descripcion_corta: "sobre-mi",
  universidad: "sobre-mi",
  año_graduacion: "sobre-mi",
  asociacion_profesional: "sobre-mi",
};

type SlugStatus =
  | { state: "checking" }
  | { state: "available" }
  | { state: "taken"; suggestions: string[] }
  | { state: "invalid"; message: string };

function asString(value: FormFieldValue | undefined): string {
  return typeof value === "string" ? value : "";
}

function asStringArray(value: FormFieldValue | undefined): string[] {
  return Array.isArray(value) ? value : [];
}

export function AbogadoWizard({
  profession,
  template,
  stockImages,
  isAuthenticated,
  onBack,
}: {
  profession: { id: string; form_schema: FormSchema };
  template: {
    id: string;
    config?: {
      primaryColor?: string;
      secondaryColor?: string;
      layout?: string;
    } | null;
  };
  stockImages: StockImage[];
  isAuthenticated: boolean;
  onBack: () => void;
}) {
  const router = useRouter();
  const [step, setStep] = useState<AbogadoStep>("datos");

  // Restores a draft left over from before this visitor signed in -- same
  // rationale as ContadorWizard.tsx. Lazy initializers so this only ever
  // runs once, as actual initial state.
  const [values, setValues] = useState<Record<string, FormFieldValue>>(() => {
    const draft = loadDraftPage();
    if (draft?.professionId === profession.id && draft.templateId === template.id) {
      return draft.formData;
    }
    return {};
  });
  const [imageMode, setImageMode] = useState<"stock" | "manual">("stock");
  const [bioMode, setBioMode] = useState<"suggested" | "custom">(() => {
    const draft = loadDraftPage();
    const restored =
      draft?.professionId === profession.id &&
      draft.templateId === template.id &&
      typeof draft.formData.descripcion_corta === "string"
        ? draft.formData.descripcion_corta
        : "";
    return restored ? "custom" : "suggested";
  });
  const [slugInput, setSlugInput] = useState(() => {
    const draft = loadDraftPage();
    if (draft?.professionId === profession.id && draft.templateId === template.id) {
      return draft.desiredSlug;
    }
    return "";
  });
  const [slugStatus, setSlugStatus] = useState<SlugStatus | null>(null);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [mobilePreviewOpen, setMobilePreviewOpen] = useState(false);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  const fieldByKey = useMemo(() => {
    const map = new Map(profession.form_schema.fields.map((f) => [f.key, f]));
    return (key: string) => map.get(key)!;
  }, [profession.form_schema]);

  // Derived, not stored -- same pattern as ContadorWizard's "quiénes somos".
  const nombre = asString(values.name);
  const matriculaNumero = asString(values.matricula_numero);
  const matriculaColegio = asString(values.matricula_colegio);
  const servicios = asStringArray(values.servicios);
  const suggestedBio =
    nombre && matriculaNumero && matriculaColegio && servicios.length > 0
      ? getSuggestedAbogadoText({
          nombre,
          matricula: matriculaNumero,
          colegio: matriculaColegio,
          servicios,
        })
      : "";
  const descripcionCorta =
    bioMode === "suggested" ? suggestedBio : asString(values.descripcion_corta);

  useEffect(() => {
    const handle = setTimeout(() => {
      saveDraftPage({
        professionId: profession.id,
        templateId: template.id,
        formData: { ...values, descripcion_corta: descripcionCorta },
        desiredSlug: slugInput,
      });
    }, DRAFT_SAVE_DEBOUNCE_MS);
    return () => clearTimeout(handle);
  }, [profession.id, template.id, values, descripcionCorta, slugInput]);

  useEffect(() => {
    if (step !== "revision" || slugInput.trim().length === 0) return;
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

  function updateValue(key: string, value: FormFieldValue) {
    setValues((v) => ({ ...v, [key]: value }));
  }

  function handleBioModeChange(mode: "suggested" | "custom") {
    setBioMode(mode);
    if (mode === "custom") {
      updateValue("descripcion_corta", "");
    }
  }

  const stepIndex = STEP_ORDER.indexOf(step);

  function canContinue(): boolean {
    switch (step) {
      case "datos":
        return (
          asString(values.name).trim().length > 0 &&
          asString(values.matricula_numero).trim().length > 0 &&
          asString(values.matricula_colegio).trim().length > 0
        );
      case "contacto":
        return WHATSAPP_VALUE_RE.test(asString(values.phone));
      case "servicios":
        return asStringArray(values.servicios).length > 0;
      case "sobre-mi":
        return true;
      case "revision":
        return slugStatus?.state === "available";
      default:
        return false;
    }
  }

  function goNext() {
    const next = STEP_ORDER[stepIndex + 1];
    if (next) setStep(next);
  }

  function goBack() {
    const prev = STEP_ORDER[stepIndex - 1];
    if (prev) setStep(prev);
    else onBack();
  }

  function handleSubmit() {
    // Flush immediately rather than waiting for the 300ms debounce -- the
    // draft must be current in sessionStorage the instant we might hand
    // off to Google OAuth.
    saveDraftPage({
      professionId: profession.id,
      templateId: template.id,
      formData: { ...values, descripcion_corta: descripcionCorta },
      desiredSlug: slugInput,
    });

    if (!isAuthenticated) {
      setAuthModalOpen(true);
      return;
    }

    setSubmitError(null);
    setFormErrors({});
    startTransition(async () => {
      const result = await createLandingAction({
        professionId: profession.id,
        templateId: template.id,
        formData: { ...values, descripcion_corta: descripcionCorta },
        desiredSlug: slugInput,
      });

      if (result.ok) {
        clearDraftPage();
        // Straight to Mercado Pago, no dashboard detour -- createSubscriptionAction
        // redirects on every success path, so reaching the line after this
        // means it failed.
        const subscribeResult = await createSubscriptionAction();
        setSubmitError(subscribeResult.message);
        return;
      }

      switch (result.reason) {
        case "invalid_form_data": {
          setFormErrors(result.errors);
          const erroredSteps = Object.keys(result.errors)
            .map((key) => FIELD_STEP[key])
            .filter((s): s is AbogadoStep => Boolean(s))
            .map((s) => STEP_ORDER.indexOf(s));
          if (erroredSteps.length > 0) {
            setStep(STEP_ORDER[Math.min(...erroredSteps)]);
          }
          break;
        }
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

  const previewFormData: AbogadoFormData = {
    name: asString(values.name) || undefined,
    matricula_numero: asString(values.matricula_numero) || undefined,
    matricula_colegio: asString(values.matricula_colegio) || undefined,
    profile_image: asString(values.profile_image) || undefined,
    phone: asString(values.phone) || undefined,
    email: asString(values.email) || undefined,
    direccion: asString(values.direccion) || undefined,
    ciudad: asString(values.ciudad) || undefined,
    provincia: asString(values.provincia) || undefined,
    linkedin_url: asString(values.linkedin_url) || undefined,
    servicios,
    descripcion_corta: descripcionCorta || undefined,
    universidad: asString(values.universidad) || undefined,
    año_graduacion: asString(values.año_graduacion) || undefined,
    asociacion_profesional: asString(values.asociacion_profesional) || undefined,
  };
  const layout = template.config?.layout;
  const colorPrimary = template.config?.primaryColor;
  const colorAccent = template.config?.secondaryColor;

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-6 px-6 py-12">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-navy">
          Paso {stepIndex + 1} de {STEP_ORDER.length} — {STEP_LABELS[step]}
        </p>
      </div>
      <div className="h-1 w-full overflow-hidden rounded-full bg-border-subtle">
        <div
          className="h-full bg-sky transition-all"
          style={{ width: `${((stepIndex + 1) / STEP_ORDER.length) * 100}%` }}
        />
      </div>

      {step === "revision" ? (
        <RevisionStep
          slugInput={slugInput}
          setSlugInput={setSlugInput}
          slugStatus={slugStatus}
          submitError={submitError}
          isPending={isPending}
          previewFormData={previewFormData}
          layout={layout}
          colorPrimary={colorPrimary}
          colorAccent={colorAccent}
          subdomain={slugInput}
          onBack={goBack}
          onSubmit={handleSubmit}
          canSubmit={canContinue()}
        />
      ) : (
        <div className="grid gap-8 lg:grid-cols-[minmax(400px,1fr)_1fr]">
          <div className="flex flex-col gap-6">
            {step === "datos" && (
              <div className="flex flex-col gap-4">
                <FieldInput
                  field={fieldByKey("name")}
                  value={values.name ?? ""}
                  error={formErrors.name}
                  onChange={(v) => updateValue("name", v)}
                  imageMode={imageMode}
                  onImageModeChange={setImageMode}
                  stockImages={stockImages}
                />
                <FieldInput
                  field={fieldByKey("matricula_numero")}
                  value={values.matricula_numero ?? ""}
                  error={formErrors.matricula_numero}
                  onChange={(v) => updateValue("matricula_numero", v)}
                  imageMode={imageMode}
                  onImageModeChange={setImageMode}
                  stockImages={stockImages}
                />
                <FieldInput
                  field={fieldByKey("matricula_colegio")}
                  value={values.matricula_colegio ?? ""}
                  error={formErrors.matricula_colegio}
                  onChange={(v) => updateValue("matricula_colegio", v)}
                  imageMode={imageMode}
                  onImageModeChange={setImageMode}
                  stockImages={stockImages}
                />
                <FieldInput
                  field={fieldByKey("profile_image")}
                  value={values.profile_image ?? ""}
                  error={formErrors.profile_image}
                  onChange={(v) => updateValue("profile_image", v)}
                  imageMode={imageMode}
                  onImageModeChange={setImageMode}
                  stockImages={stockImages}
                />
              </div>
            )}

            {step === "contacto" && (
              <div className="flex flex-col gap-4">
                <FieldInput
                  field={fieldByKey("phone")}
                  value={values.phone ?? ""}
                  error={formErrors.phone}
                  onChange={(v) => updateValue("phone", v)}
                  imageMode={imageMode}
                  onImageModeChange={setImageMode}
                  stockImages={stockImages}
                />
                <FieldInput
                  field={fieldByKey("email")}
                  value={values.email ?? ""}
                  error={formErrors.email}
                  onChange={(v) => updateValue("email", v)}
                  imageMode={imageMode}
                  onImageModeChange={setImageMode}
                  stockImages={stockImages}
                />
                <FieldInput
                  field={fieldByKey("direccion")}
                  value={values.direccion ?? ""}
                  error={formErrors.direccion}
                  onChange={(v) => updateValue("direccion", v)}
                  imageMode={imageMode}
                  onImageModeChange={setImageMode}
                  stockImages={stockImages}
                />
                <FieldInput
                  field={fieldByKey("ciudad")}
                  value={values.ciudad ?? ""}
                  error={formErrors.ciudad}
                  onChange={(v) => updateValue("ciudad", v)}
                  imageMode={imageMode}
                  onImageModeChange={setImageMode}
                  stockImages={stockImages}
                />
                <FieldInput
                  field={fieldByKey("provincia")}
                  value={values.provincia ?? ""}
                  error={formErrors.provincia}
                  onChange={(v) => updateValue("provincia", v)}
                  imageMode={imageMode}
                  onImageModeChange={setImageMode}
                  stockImages={stockImages}
                />
                <FieldInput
                  field={fieldByKey("linkedin_url")}
                  value={values.linkedin_url ?? ""}
                  error={formErrors.linkedin_url}
                  onChange={(v) => updateValue("linkedin_url", v)}
                  imageMode={imageMode}
                  onImageModeChange={setImageMode}
                  stockImages={stockImages}
                />
              </div>
            )}

            {step === "servicios" && (
              <FieldInput
                field={fieldByKey("servicios")}
                value={values.servicios ?? []}
                error={formErrors.servicios}
                onChange={(v) => updateValue("servicios", v)}
                imageMode={imageMode}
                onImageModeChange={setImageMode}
                stockImages={stockImages}
              />
            )}

            {step === "sobre-mi" && (
              <div className="flex flex-col gap-4">
                <div className="flex flex-col gap-3">
                  <label className="text-sm font-medium text-navy">Quiénes somos</label>
                  <div className="flex gap-4 text-sm">
                    <button
                      type="button"
                      onClick={() => handleBioModeChange("suggested")}
                      className={bioMode === "suggested" ? TOGGLE_ACTIVE : TOGGLE_INACTIVE}
                    >
                      Usar texto sugerido
                    </button>
                    <button
                      type="button"
                      onClick={() => handleBioModeChange("custom")}
                      className={bioMode === "custom" ? TOGGLE_ACTIVE : TOGGLE_INACTIVE}
                    >
                      Escribir el mío
                    </button>
                  </div>
                  {bioMode === "suggested" ? (
                    <p className="rounded-lg border border-border-subtle bg-surface-muted px-3 py-2 text-sm leading-relaxed text-navy">
                      {suggestedBio ||
                        "Completá tus datos y áreas de práctica para generar el texto sugerido."}
                    </p>
                  ) : (
                    <textarea
                      value={asString(values.descripcion_corta)}
                      onChange={(e) => updateValue("descripcion_corta", e.target.value)}
                      rows={5}
                      maxLength={500}
                      placeholder={getSuggestedAbogadoText({
                        nombre: nombre || "Tu nombre",
                        matricula: matriculaNumero || "12345",
                        colegio: matriculaColegio || "tu colegio",
                        servicios: servicios.length > 0 ? servicios : ["familia"],
                      })}
                      className="rounded-lg border border-border-subtle bg-white px-3 py-2 text-sm text-navy placeholder:text-text-body/50 focus:border-sky focus:outline-none focus:ring-2 focus:ring-sky/30"
                    />
                  )}
                  {formErrors.descripcion_corta && (
                    <p className="text-sm text-red-600">{formErrors.descripcion_corta}</p>
                  )}
                </div>
                <FieldInput
                  field={fieldByKey("universidad")}
                  value={values.universidad ?? ""}
                  error={formErrors.universidad}
                  onChange={(v) => updateValue("universidad", v)}
                  imageMode={imageMode}
                  onImageModeChange={setImageMode}
                  stockImages={stockImages}
                />
                <FieldInput
                  field={fieldByKey("año_graduacion")}
                  value={values.año_graduacion ?? ""}
                  error={formErrors.año_graduacion}
                  onChange={(v) => updateValue("año_graduacion", v)}
                  imageMode={imageMode}
                  onImageModeChange={setImageMode}
                  stockImages={stockImages}
                />
                <FieldInput
                  field={fieldByKey("asociacion_profesional")}
                  value={values.asociacion_profesional ?? ""}
                  error={formErrors.asociacion_profesional}
                  onChange={(v) => updateValue("asociacion_profesional", v)}
                  imageMode={imageMode}
                  onImageModeChange={setImageMode}
                  stockImages={stockImages}
                />
              </div>
            )}

            <div className="flex gap-3">
              <button onClick={goBack} className={SECONDARY_BUTTON}>
                Volver
              </button>
              <button onClick={goNext} disabled={!canContinue()} className={PRIMARY_BUTTON}>
                Continuar
              </button>
            </div>
          </div>

          <div className="hidden lg:block">
            <div className="sticky top-6 max-h-[calc(100vh-3rem)] overflow-y-auto rounded-2xl border border-border-subtle shadow-sm">
              <TemplatePreview
                layout={layout}
                formData={previewFormData}
                colorPrimary={colorPrimary}
                colorAccent={colorAccent}
                subdomain={slugInput}
              />
            </div>
          </div>
        </div>
      )}

      {step !== "revision" && (
        <button
          onClick={() => setMobilePreviewOpen(true)}
          className="fixed bottom-6 right-6 z-40 flex h-14 items-center gap-2 rounded-full bg-navy px-5 text-sm font-medium text-white shadow-lg lg:hidden"
        >
          Ver mi página 👁️
        </button>
      )}

      {mobilePreviewOpen && (
        <div className="fixed inset-0 z-50 flex flex-col bg-white lg:hidden">
          <div className="flex items-center justify-between border-b border-border-subtle px-4 py-3">
            <span className="text-sm font-medium text-navy">Vista previa</span>
            <button
              onClick={() => setMobilePreviewOpen(false)}
              className="flex min-h-12 items-center px-2 text-sm text-text-body"
            >
              Cerrar ✕
            </button>
          </div>
          <div className="flex-1 overflow-y-auto">
            <TemplatePreview
              layout={layout}
              formData={previewFormData}
              colorPrimary={colorPrimary}
              colorAccent={colorAccent}
              subdomain={slugInput}
            />
          </div>
        </div>
      )}

      {authModalOpen && (
        <AuthModal nextPath={PUBLISHING_PATH} onClose={() => setAuthModalOpen(false)} />
      )}
    </div>
  );
}

function RevisionStep({
  slugInput,
  setSlugInput,
  slugStatus,
  submitError,
  isPending,
  previewFormData,
  layout,
  colorPrimary,
  colorAccent,
  subdomain,
  onBack,
  onSubmit,
  canSubmit,
}: {
  slugInput: string;
  setSlugInput: (v: string) => void;
  slugStatus: SlugStatus | null;
  submitError: string | null;
  isPending: boolean;
  previewFormData: AbogadoFormData;
  layout?: string;
  colorPrimary?: string;
  colorAccent?: string;
  subdomain: string;
  onBack: () => void;
  onSubmit: () => void;
  canSubmit: boolean;
}) {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <h2 className="text-xl font-semibold text-navy">Elegí tu subdominio</h2>
        <div className="flex items-center gap-2">
          <input
            value={slugInput}
            onChange={(e) => setSlugInput(e.target.value)}
            placeholder="ej: estudiogomez"
            className="min-h-12 flex-1 rounded-lg border border-border-subtle bg-white px-3 py-2 text-navy focus:border-sky focus:outline-none focus:ring-2 focus:ring-sky/30"
          />
          <span className="text-sm text-text-body">.{ROOT_DOMAIN}</span>
        </div>
        {slugStatus && <SlugFeedback status={slugStatus} onPick={setSlugInput} />}
      </div>

      <div className="flex flex-col gap-2">
        <h2 className="text-xl font-semibold text-navy">Así se va a ver tu página</h2>
        <div className="overflow-hidden rounded-2xl border border-border-subtle shadow-sm">
          <TemplatePreview
            layout={layout}
            formData={previewFormData}
            colorPrimary={colorPrimary}
            colorAccent={colorAccent}
            subdomain={subdomain}
          />
        </div>
      </div>

      {submitError && <p className="text-sm text-red-600">{submitError}</p>}

      <div className="flex gap-3">
        <button onClick={onBack} className={SECONDARY_BUTTON}>
          Volver
        </button>
        <button onClick={onSubmit} disabled={isPending || !canSubmit} className={PRIMARY_BUTTON}>
          {isPending ? "Publicando..." : "Publicar mi página"}
        </button>
      </div>
    </div>
  );
}

// Same dispatch rule as PublicLandingView.tsx: three layouts, one component
// each. Kept as one place so the three preview spots above (desktop
// sticky, mobile modal, revision step) can't drift out of sync.
function TemplatePreview({
  layout,
  formData,
  colorPrimary,
  colorAccent,
  subdomain,
}: {
  layout?: string;
  formData: AbogadoFormData;
  colorPrimary?: string;
  colorAccent?: string;
  subdomain: string;
}) {
  if (layout === "modern") {
    return (
      <AbogadoModernoTemplate
        formData={formData}
        sectionsConfig={DEFAULT_SECTIONS_CONFIG}
        subdomain={subdomain || undefined}
        colorPrimary={colorPrimary}
        colorAccent={colorAccent}
      />
    );
  }
  if (layout === "clasico") {
    return (
      <AbogadoClasicoTemplate
        formData={formData}
        sectionsConfig={DEFAULT_SECTIONS_CONFIG}
        subdomain={subdomain || undefined}
        colorPrimary={colorPrimary}
        colorAccent={colorAccent}
      />
    );
  }
  return (
    <AbogadoMinimalTemplate
      formData={formData}
      sectionsConfig={DEFAULT_SECTIONS_CONFIG}
      subdomain={subdomain || undefined}
      colorPrimary={colorPrimary}
    />
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
    return <p className="text-sm text-text-body">Comprobando disponibilidad...</p>;
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
