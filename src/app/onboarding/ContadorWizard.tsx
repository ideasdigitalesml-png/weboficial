"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { FormSchema, FormFieldValue } from "@/lib/forms/validate-form-data";
import { WHATSAPP_VALUE_RE } from "@/lib/whatsapp";
import { getSuggestedContadorText } from "@/lib/professions/contadores";
import { DEFAULT_SECTIONS_CONFIG } from "@/lib/landings/create-landing";
import { ROOT_DOMAIN } from "@/lib/root-domain";
import { FieldInput, type StockImage } from "@/components/forms/FieldInput";
import {
  ContadorLandingTemplate,
  type ContadorFormData,
} from "@/components/templates/contador/ContadorLandingTemplate";
import { ContadorModernoTemplate } from "@/components/templates/contador/ContadorModernoTemplate";
import { PaletteSelector } from "@/components/templates/PaletteSelector";
import {
  CONTADOR_PALETAS,
  DEFAULT_CONTADOR_PALETA_ID,
  findContadorPaleta,
} from "@/lib/templates/contador-paletas";
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

type ContadorStep =
  | "datos"
  | "contacto"
  | "servicios"
  | "quienes"
  | "paleta"
  | "revision";

const BASE_STEP_ORDER: ContadorStep[] = [
  "datos",
  "contacto",
  "servicios",
  "quienes",
  "revision",
];

// The "paleta" step only exists for the Moderno layout -- Clásico has no
// paleta system yet (see src/lib/templates/contador-paletas.ts), so it
// keeps the original 5-step flow.
const MODERNO_STEP_ORDER: ContadorStep[] = [
  "datos",
  "contacto",
  "servicios",
  "quienes",
  "paleta",
  "revision",
];

const STEP_LABELS: Record<ContadorStep, string> = {
  datos: "Tus datos",
  contacto: "Contacto",
  servicios: "Servicios",
  quienes: "Quiénes somos",
  paleta: "Paleta de colores",
  revision: "Revisión y publicación",
};

// Which step owns each form_schema field -- used to route server-side
// validation errors (returned by key) back to the right step.
const FIELD_STEP: Record<string, ContadorStep> = {
  name: "datos",
  matricula: "datos",
  jurisdiccion: "datos",
  profile_image: "datos",
  phone: "contacto",
  email: "contacto",
  zona: "contacto",
  modalidad: "contacto",
  servicios: "servicios",
  description: "quienes",
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

export function ContadorWizard({
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
  const [step, setStep] = useState<ContadorStep>("datos");

  // Restores a draft left over from before this visitor signed in (e.g.
  // they clicked "Publicar", went through Google, and the create/subscribe
  // step failed -- /onboarding/publishing sends them back here with the
  // draft still in sessionStorage). Lazy initializers so this only ever
  // runs once, on mount, as actual initial state -- not as a post-mount
  // effect that would have to call setState itself. Only restores if it's
  // a draft for this same profession/template; anything else is ignored.
  const [values, setValues] = useState<Record<string, FormFieldValue>>(() => {
    const draft = loadDraftPage();
    if (draft?.professionId === profession.id && draft.templateId === template.id) {
      return draft.formData;
    }
    return {};
  });
  const [imageMode, setImageMode] = useState<"stock" | "manual">("stock");
  const [quienesMode, setQuienesMode] = useState<"suggested" | "custom">(() => {
    const draft = loadDraftPage();
    const restoredDescription =
      draft?.professionId === profession.id &&
      draft.templateId === template.id &&
      typeof draft.formData.description === "string"
        ? draft.formData.description
        : "";
    return restoredDescription ? "custom" : "suggested";
  });
  const [slugInput, setSlugInput] = useState(() => {
    const draft = loadDraftPage();
    if (draft?.professionId === profession.id && draft.templateId === template.id) {
      return draft.desiredSlug;
    }
    return "";
  });
  const [slugStatus, setSlugStatus] = useState<SlugStatus | null>(null);
  const [paletaId, setPaletaId] = useState(() => {
    const draft = loadDraftPage();
    if (draft?.professionId === profession.id && draft.templateId === template.id) {
      return draft.paletaId ?? DEFAULT_CONTADOR_PALETA_ID;
    }
    return DEFAULT_CONTADOR_PALETA_ID;
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [mobilePreviewOpen, setMobilePreviewOpen] = useState(false);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  const fieldByKey = useMemo(() => {
    const map = new Map(profession.form_schema.fields.map((f) => [f.key, f]));
    return (key: string) => map.get(key)!;
  }, [profession.form_schema]);

  // Derived, not stored -- recomputes on every render from whatever's
  // currently in the datos/servicios steps. Only used while quienesMode is
  // "suggested"; the moment the contador switches to "custom",
  // values.description becomes the single source of truth instead.
  const nombre = asString(values.name);
  const matricula = asString(values.matricula);
  const jurisdiccion = asString(values.jurisdiccion);
  const servicios = asStringArray(values.servicios);
  const suggestedDescription =
    nombre && matricula && jurisdiccion && servicios.length > 0
      ? getSuggestedContadorText({ nombre, matricula, jurisdiccion, servicios })
      : "";
  const description =
    quienesMode === "suggested" ? suggestedDescription : asString(values.description);

  // Persists on every change, debounced, so an anonymous visitor's draft
  // survives the same-tab round trip through Google OAuth (see
  // draft-storage.ts) -- not to survive a closed tab, which correctly
  // still loses it (sessionStorage).
  useEffect(() => {
    const handle = setTimeout(() => {
      saveDraftPage({
        professionId: profession.id,
        templateId: template.id,
        formData: { ...values, description },
        desiredSlug: slugInput,
        paletaId,
      });
    }, DRAFT_SAVE_DEBOUNCE_MS);
    return () => clearTimeout(handle);
  }, [profession.id, template.id, values, description, slugInput, paletaId]);

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

  function handleQuienesModeChange(mode: "suggested" | "custom") {
    setQuienesMode(mode);
    if (mode === "custom") {
      updateValue("description", "");
    }
  }

  const isModerno = template.config?.layout === "modern";
  const stepOrder = isModerno ? MODERNO_STEP_ORDER : BASE_STEP_ORDER;
  const stepIndex = stepOrder.indexOf(step);

  function canContinue(): boolean {
    switch (step) {
      case "datos":
        return (
          asString(values.name).trim().length > 0 &&
          asString(values.matricula).trim().length > 0 &&
          asString(values.jurisdiccion).trim().length > 0
        );
      case "contacto":
        return WHATSAPP_VALUE_RE.test(asString(values.phone));
      case "servicios":
        return asStringArray(values.servicios).length > 0;
      case "quienes":
        return true;
      case "paleta":
        return true;
      case "revision":
        return slugStatus?.state === "available";
      default:
        return false;
    }
  }

  function goNext() {
    const next = stepOrder[stepIndex + 1];
    if (next) setStep(next);
  }

  function goBack() {
    const prev = stepOrder[stepIndex - 1];
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
      formData: { ...values, description },
      desiredSlug: slugInput,
      paletaId,
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
        formData: { ...values, description },
        desiredSlug: slugInput,
        paletaId: isModerno ? paletaId : undefined,
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
            .filter((s): s is ContadorStep => Boolean(s))
            .map((s) => stepOrder.indexOf(s));
          if (erroredSteps.length > 0) {
            setStep(stepOrder[Math.min(...erroredSteps)]);
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

  const previewFormData: ContadorFormData = {
    name: asString(values.name) || undefined,
    matricula: asString(values.matricula) || undefined,
    jurisdiccion: asString(values.jurisdiccion) || undefined,
    profile_image: asString(values.profile_image) || undefined,
    phone: asString(values.phone) || undefined,
    email: asString(values.email) || undefined,
    zona: asString(values.zona) || undefined,
    modalidad: asString(values.modalidad) || undefined,
    servicios: asStringArray(values.servicios),
    description: description || undefined,
  };
  const colorPrimary = template.config?.primaryColor;
  const colorAccent = template.config?.secondaryColor;
  const paletteVariables = isModerno
    ? findContadorPaleta(paletaId).variables
    : undefined;

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-6 px-6 py-12">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-navy">
          Paso {stepIndex + 1} de {stepOrder.length} — {STEP_LABELS[step]}
        </p>
      </div>
      <div className="h-1 w-full overflow-hidden rounded-full bg-border-subtle">
        <div
          className="h-full bg-sky transition-all"
          style={{ width: `${((stepIndex + 1) / stepOrder.length) * 100}%` }}
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
          isModerno={isModerno}
          colorPrimary={colorPrimary}
          colorAccent={colorAccent}
          paletteVariables={paletteVariables}
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
                  field={fieldByKey("matricula")}
                  value={values.matricula ?? ""}
                  error={formErrors.matricula}
                  onChange={(v) => updateValue("matricula", v)}
                  imageMode={imageMode}
                  onImageModeChange={setImageMode}
                  stockImages={stockImages}
                />
                <FieldInput
                  field={fieldByKey("jurisdiccion")}
                  value={values.jurisdiccion ?? ""}
                  error={formErrors.jurisdiccion}
                  onChange={(v) => updateValue("jurisdiccion", v)}
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
                  field={fieldByKey("zona")}
                  value={values.zona ?? ""}
                  error={formErrors.zona}
                  onChange={(v) => updateValue("zona", v)}
                  imageMode={imageMode}
                  onImageModeChange={setImageMode}
                  stockImages={stockImages}
                />
                <FieldInput
                  field={fieldByKey("modalidad")}
                  value={values.modalidad ?? ""}
                  error={formErrors.modalidad}
                  onChange={(v) => updateValue("modalidad", v)}
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

            {step === "quienes" && (
              <div className="flex flex-col gap-3">
                <label className="text-sm font-medium text-navy">
                  Quiénes somos
                </label>
                <div className="flex gap-4 text-sm">
                  <button
                    type="button"
                    onClick={() => handleQuienesModeChange("suggested")}
                    className={
                      quienesMode === "suggested" ? TOGGLE_ACTIVE : TOGGLE_INACTIVE
                    }
                  >
                    Usar texto sugerido
                  </button>
                  <button
                    type="button"
                    onClick={() => handleQuienesModeChange("custom")}
                    className={
                      quienesMode === "custom" ? TOGGLE_ACTIVE : TOGGLE_INACTIVE
                    }
                  >
                    Escribir el mío
                  </button>
                </div>
                {quienesMode === "suggested" ? (
                  <p className="rounded-lg border border-border-subtle bg-surface-muted px-3 py-2 text-sm leading-relaxed text-navy">
                    {suggestedDescription ||
                      "Completá tus datos y servicios para generar el texto sugerido."}
                  </p>
                ) : (
                  <textarea
                    value={asString(values.description)}
                    onChange={(e) => updateValue("description", e.target.value)}
                    rows={5}
                    maxLength={400}
                    placeholder={getSuggestedContadorText({
                      nombre: nombre || "Tu nombre",
                      matricula: matricula || "12345",
                      jurisdiccion: jurisdiccion || "tu jurisdicción",
                      servicios: servicios.length > 0 ? servicios : ["monotributo"],
                    })}
                    className="rounded-lg border border-border-subtle bg-white px-3 py-2 text-sm text-navy placeholder:text-text-body/50 focus:border-sky focus:outline-none focus:ring-2 focus:ring-sky/30"
                  />
                )}
                {formErrors.description && (
                  <p className="text-sm text-red-600">
                    {formErrors.description}
                  </p>
                )}
              </div>
            )}

            {step === "paleta" && (
              <div className="flex flex-col gap-4">
                <h2 className="text-xl font-semibold text-navy">
                  Elegí el estilo de colores
                </h2>
                <PaletteSelector
                  paletas={CONTADOR_PALETAS}
                  selectedId={paletaId}
                  onSelect={setPaletaId}
                />
              </div>
            )}

            <div className="flex gap-3">
              <button onClick={goBack} className={SECONDARY_BUTTON}>
                Volver
              </button>
              <button
                onClick={goNext}
                disabled={!canContinue()}
                className={PRIMARY_BUTTON}
              >
                Continuar
              </button>
            </div>
          </div>

          <div className="hidden lg:block">
            <div className="sticky top-6 overflow-hidden rounded-2xl border border-border-subtle shadow-sm bg-white" style={{ height: "calc(100vh - 3rem)", position: "relative" }}>
              {/* Escala el template real para que se vea como miniatura */}
              <div style={{ position: "absolute", top: 0, left: 0, width: "1100px", transform: "scale(0.4)", transformOrigin: "top left", pointerEvents: "none" }}>
                <TemplatePreview
                  isModerno={isModerno}
                  formData={previewFormData}
                  colorPrimary={colorPrimary}
                  colorAccent={colorAccent}
                  paletteVariables={paletteVariables}
                  subdomain={slugInput}
                />
              </div>
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
              isModerno={isModerno}
              formData={previewFormData}
              colorPrimary={colorPrimary}
              colorAccent={colorAccent}
              subdomain={slugInput}
            />
          </div>
        </div>
      )}

      {authModalOpen && (
        <AuthModal
          nextPath={PUBLISHING_PATH}
          onClose={() => setAuthModalOpen(false)}
        />
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
  isModerno,
  colorPrimary,
  colorAccent,
  paletteVariables,
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
  previewFormData: ContadorFormData;
  isModerno: boolean;
  colorPrimary?: string;
  colorAccent?: string;
  paletteVariables?: Record<string, string>;
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
            placeholder="ej: contadorjuanperez"
            className="min-h-12 flex-1 rounded-lg border border-border-subtle bg-white px-3 py-2 text-navy focus:border-sky focus:outline-none focus:ring-2 focus:ring-sky/30"
          />
          <span className="text-sm text-text-body">.{ROOT_DOMAIN}</span>
        </div>
        {slugStatus && <SlugFeedback status={slugStatus} onPick={setSlugInput} />}
      </div>

      <div className="flex flex-col gap-2">
        <h2 className="text-xl font-semibold text-navy">
          Así se va a ver tu página
        </h2>
        <div className="overflow-hidden rounded-2xl border border-border-subtle shadow-sm">
          <TemplatePreview
            isModerno={isModerno}
            formData={previewFormData}
            colorPrimary={colorPrimary}
            colorAccent={colorAccent}
            paletteVariables={paletteVariables}
            subdomain={subdomain}
          />
        </div>
      </div>

      {submitError && <p className="text-sm text-red-600">{submitError}</p>}

      <div className="flex gap-3">
        <button onClick={onBack} className={SECONDARY_BUTTON}>
          Volver
        </button>
        <button
          onClick={onSubmit}
          disabled={isPending || !canSubmit}
          className={PRIMARY_BUTTON}
        >
          {isPending ? "Publicando..." : "Publicar mi página"}
        </button>
      </div>
    </div>
  );
}

// Same dispatch rule as PublicLandingView.tsx: templates whose config marks
// layout "modern" get the new design, everything else keeps the original
// (Clásico) one. Kept as one place so the three preview spots above
// (desktop sticky, mobile modal, revision step) can't drift out of sync.
function TemplatePreview({
  isModerno,
  formData,
  colorPrimary,
  colorAccent,
  paletteVariables,
  subdomain,
}: {
  isModerno: boolean;
  formData: ContadorFormData;
  colorPrimary?: string;
  colorAccent?: string;
  paletteVariables?: Record<string, string>;
  subdomain: string;
}) {
  if (isModerno) {
    return (
      <ContadorModernoTemplate
        formData={formData}
        sectionsConfig={DEFAULT_SECTIONS_CONFIG}
        subdomain={subdomain || undefined}
        colorPrimary={colorPrimary}
        colorAccent={colorAccent}
        paletteVariables={paletteVariables}
      />
    );
  }
  return (
    <ContadorLandingTemplate
      formData={formData}
      sectionsConfig={DEFAULT_SECTIONS_CONFIG}
      accentColor={colorPrimary}
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
