"use client";

import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { FormSchema, FormFieldValue, RepeaterItem } from "@/lib/forms/validate-form-data";
import { WHATSAPP_VALUE_RE } from "@/lib/whatsapp";
import { getSuggestedPsicologoText } from "@/lib/professions/psicologos";
import { DEFAULT_SECTIONS_CONFIG } from "@/lib/landings/create-landing";
import { ROOT_DOMAIN } from "@/lib/root-domain";
import { FieldInput, type StockImage } from "@/components/forms/FieldInput";
import {
  PsicologoModernoTemplate,
  type PsicologoFormData,
} from "@/components/templates/psicologo/PsicologoModernoTemplate";
import { PsicologoClasicoTemplate } from "@/components/templates/psicologo/PsicologoClasicoTemplate";
import { PsicologoMinimalTemplate } from "@/components/templates/psicologo/PsicologoMinimalTemplate";
import { checkSlugAvailabilityAction, createLandingAction } from "./actions";
import {
  PRIMARY_BUTTON,
  SECONDARY_BUTTON,
  TOGGLE_ACTIVE,
  TOGGLE_INACTIVE,
} from "./styles";
import { createSubscriptionAction } from "@/app/dashboard/actions";
import { saveDraftPage, loadDraftPage, clearDraftPage } from "./draft-storage";
import { uploadPendingPhotos } from "./photo-upload";
import { createClient } from "@/lib/supabase/client";
import { AuthModal } from "./AuthModal";

const PUBLISHING_PATH = "/onboarding/publishing";
const DRAFT_SAVE_DEBOUNCE_MS = 300;

type PsicologoStep = "datos" | "contacto" | "especialidades" | "sobre-mi" | "revision";

const STEP_ORDER: PsicologoStep[] = [
  "datos",
  "contacto",
  "especialidades",
  "sobre-mi",
  "revision",
];

const STEP_LABELS: Record<PsicologoStep, string> = {
  datos: "Tus datos",
  contacto: "Contacto",
  especialidades: "Especialidades",
  "sobre-mi": "Sobre mí",
  revision: "Revisión y publicación",
};

// Which step owns each form_schema field -- used to route server-side
// validation errors (returned by key) back to the right step.
const FIELD_STEP: Record<string, PsicologoStep> = {
  name: "datos",
  titulo_profesional: "datos",
  matricula_numero: "datos",
  profile_image: "datos",
  phone: "contacto",
  email: "contacto",
  direccion: "contacto",
  horario_atencion: "contacto",
  modalidad: "contacto",
  linkedin_url: "contacto",
  instagram_url: "contacto",
  especialidades: "especialidades",
  descripcion: "sobre-mi",
  enfoque_terapeutico: "sobre-mi",
  precio_consulta: "sobre-mi",
  obras_sociales: "sobre-mi",
  cta_text: "sobre-mi",
};

type SlugStatus =
  | { state: "checking" }
  | { state: "available" }
  | { state: "taken"; suggestions: string[] }
  | { state: "invalid"; message: string };

function asString(value: FormFieldValue | undefined): string {
  return typeof value === "string" ? value : "";
}

function asRepeaterItems(value: FormFieldValue | undefined): RepeaterItem[] {
  return Array.isArray(value)
    ? value.filter(
        (v): v is RepeaterItem => typeof v === "object" && v !== null && !Array.isArray(v)
      )
    : [];
}

function hasNonEmptyTitulo(items: RepeaterItem[]): boolean {
  return items.some((item) => (item.titulo ?? "").trim().length > 0);
}

export function PsicologoWizard({
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
  // Preview scaling — fills the container width dynamically
  const previewContainerRef = useRef<HTMLDivElement>(null);
  const [previewScale, setPreviewScale] = useState(0.4);
  useEffect(() => {
    const el = previewContainerRef.current;
    if (!el) return;
    const update = () => setPreviewScale(el.offsetWidth / 1100);
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const [step, setStep] = useState<PsicologoStep>("datos");

  // Restores a draft left over from before this visitor signed in -- same
  // rationale as AbogadoWizard.tsx. Lazy initializers so this only ever
  // runs once, as actual initial state.
  const [values, setValues] = useState<Record<string, FormFieldValue>>(() => {
    const draft = loadDraftPage();
    if (draft?.professionId === profession.id && draft.templateId === template.id) {
      return draft.formData;
    }
    return {};
  });
  const [bioMode, setBioMode] = useState<"suggested" | "custom">(() => {
    const draft = loadDraftPage();
    const restored =
      draft?.professionId === profession.id &&
      draft.templateId === template.id &&
      typeof draft.formData.descripcion === "string"
        ? draft.formData.descripcion
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

  // Derived, not stored -- same pattern as AbogadoWizard's "sobre mí".
  const nombre = asString(values.name);
  const tituloProfesional = asString(values.titulo_profesional);
  const matriculaNumero = asString(values.matricula_numero);
  const enfoqueTerapeutico = asString(values.enfoque_terapeutico);
  const especialidades = asRepeaterItems(values.especialidades);
  const especialidadTitulos = especialidades
    .map((e) => (e.titulo ?? "").trim())
    .filter(Boolean);
  const obrasSociales = asRepeaterItems(values.obras_sociales);
  const suggestedBio =
    nombre && tituloProfesional && matriculaNumero
      ? getSuggestedPsicologoText({
          nombre,
          titulo: tituloProfesional,
          matricula: matriculaNumero,
          enfoque: enfoqueTerapeutico || undefined,
          especialidades: especialidadTitulos,
        })
      : "";
  const descripcion = bioMode === "suggested" ? suggestedBio : asString(values.descripcion);

  useEffect(() => {
    const handle = setTimeout(() => {
      saveDraftPage({
        professionId: profession.id,
        templateId: template.id,
        formData: { ...values, descripcion },
        desiredSlug: slugInput,
      });
    }, DRAFT_SAVE_DEBOUNCE_MS);
    return () => clearTimeout(handle);
  }, [profession.id, template.id, values, descripcion, slugInput]);

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
      updateValue("descripcion", "");
    }
  }

  const stepIndex = STEP_ORDER.indexOf(step);

  function canContinue(): boolean {
    switch (step) {
      case "datos":
        return (
          asString(values.name).trim().length > 0 &&
          asString(values.titulo_profesional).trim().length > 0 &&
          asString(values.matricula_numero).trim().length > 0
        );
      case "contacto":
        return WHATSAPP_VALUE_RE.test(asString(values.phone));
      case "especialidades":
        return hasNonEmptyTitulo(especialidades);
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
      formData: { ...values, descripcion },
      desiredSlug: slugInput,
    });

    if (!isAuthenticated) {
      setAuthModalOpen(true);
      return;
    }

    setSubmitError(null);
    setFormErrors({});
    startTransition(async () => {
      // values.profile_image may be a base64 data URL (see ImageFieldInput
      // in FieldInput.tsx) rather than a real URL yet -- upload it now,
      // since we're guaranteed a session at this point (isAuthenticated).
      let formData: Record<string, unknown> = {
        ...values,
        descripcion,
      };
      try {
        formData = await uploadPendingPhotos(createClient(), formData);
      } catch {
        setSubmitError("No se pudo subir la foto de perfil. Intentá de nuevo.");
        return;
      }

      const result = await createLandingAction({
        professionId: profession.id,
        templateId: template.id,
        formData,
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
            .filter((s): s is PsicologoStep => Boolean(s))
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

  const previewFormData: PsicologoFormData = {
    name: asString(values.name) || undefined,
    titulo_profesional: asString(values.titulo_profesional) || undefined,
    matricula_numero: asString(values.matricula_numero) || undefined,
    profile_image: asString(values.profile_image) || undefined,
    phone: asString(values.phone) || undefined,
    email: asString(values.email) || undefined,
    direccion: asString(values.direccion) || undefined,
    horario_atencion: asString(values.horario_atencion) || undefined,
    modalidad: asString(values.modalidad) || undefined,
    linkedin_url: asString(values.linkedin_url) || undefined,
    instagram_url: asString(values.instagram_url) || undefined,
    especialidades: especialidades.length > 0 ? especialidades : undefined,
    descripcion: descripcion || undefined,
    enfoque_terapeutico: enfoqueTerapeutico || undefined,
    precio_consulta: asString(values.precio_consulta) || undefined,
    obras_sociales: obrasSociales.length > 0 ? obrasSociales : undefined,
    cta_text: asString(values.cta_text) || undefined,
  };
  const layout = template.config?.layout;
  const colorPrimary = template.config?.primaryColor;
  const colorAccent = template.config?.secondaryColor;

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-6 px-5 py-6 sm:px-6 sm:py-12">
      <div className="sticky top-0 z-30 -mx-5 bg-white/95 px-5 pt-2 pb-3 backdrop-blur sm:static sm:mx-0 sm:bg-transparent sm:px-0 sm:py-0 sm:backdrop-blur-none">
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium text-navy">
            Paso {stepIndex + 1} de {STEP_ORDER.length} — {STEP_LABELS[step]}
          </p>
        </div>
        <div className="mt-2 h-1 w-full overflow-hidden rounded-full bg-border-subtle sm:mt-0">
          <div
            className="h-full bg-sky transition-all"
            style={{ width: `${((stepIndex + 1) / STEP_ORDER.length) * 100}%` }}
          />
        </div>
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
                />
                <FieldInput
                  field={fieldByKey("titulo_profesional")}
                  value={values.titulo_profesional ?? ""}
                  error={formErrors.titulo_profesional}
                  onChange={(v) => updateValue("titulo_profesional", v)}
                />
                <FieldInput
                  field={fieldByKey("matricula_numero")}
                  value={values.matricula_numero ?? ""}
                  error={formErrors.matricula_numero}
                  onChange={(v) => updateValue("matricula_numero", v)}
                />
                <FieldInput
                  field={fieldByKey("profile_image")}
                  value={values.profile_image ?? ""}
                  error={formErrors.profile_image}
                  onChange={(v) => updateValue("profile_image", v)}
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
                />
                <FieldInput
                  field={fieldByKey("email")}
                  value={values.email ?? ""}
                  error={formErrors.email}
                  onChange={(v) => updateValue("email", v)}
                />
                <FieldInput
                  field={fieldByKey("direccion")}
                  value={values.direccion ?? ""}
                  error={formErrors.direccion}
                  onChange={(v) => updateValue("direccion", v)}
                />
                <FieldInput
                  field={fieldByKey("horario_atencion")}
                  value={values.horario_atencion ?? ""}
                  error={formErrors.horario_atencion}
                  onChange={(v) => updateValue("horario_atencion", v)}
                />
                <FieldInput
                  field={fieldByKey("modalidad")}
                  value={values.modalidad ?? ""}
                  error={formErrors.modalidad}
                  onChange={(v) => updateValue("modalidad", v)}
                />
                <FieldInput
                  field={fieldByKey("linkedin_url")}
                  value={values.linkedin_url ?? ""}
                  error={formErrors.linkedin_url}
                  onChange={(v) => updateValue("linkedin_url", v)}
                />
                <FieldInput
                  field={fieldByKey("instagram_url")}
                  value={values.instagram_url ?? ""}
                  error={formErrors.instagram_url}
                  onChange={(v) => updateValue("instagram_url", v)}
                />
              </div>
            )}

            {step === "especialidades" && (
              <FieldInput
                field={fieldByKey("especialidades")}
                value={values.especialidades ?? []}
                error={formErrors.especialidades}
                onChange={(v) => updateValue("especialidades", v)}
              />
            )}

            {step === "sobre-mi" && (
              <div className="flex flex-col gap-4">
                <div className="flex flex-col gap-3">
                  <label className="text-sm font-medium text-navy">Sobre mí</label>
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
                        "Completá tus datos y especialidades para generar el texto sugerido."}
                    </p>
                  ) : (
                    <textarea
                      value={asString(values.descripcion)}
                      onChange={(e) => updateValue("descripcion", e.target.value)}
                      rows={5}
                      maxLength={800}
                      placeholder={getSuggestedPsicologoText({
                        nombre: nombre || "Tu nombre",
                        titulo: tituloProfesional || "Lic. en Psicología",
                        matricula: matriculaNumero || "12345",
                        enfoque: enfoqueTerapeutico || undefined,
                        especialidades:
                          especialidadTitulos.length > 0 ? especialidadTitulos : ["ansiedad"],
                      })}
                      className="rounded-lg border border-border-subtle bg-white px-3 py-2 text-sm text-navy placeholder:text-text-body/50 focus:border-sky focus:outline-none focus:ring-2 focus:ring-sky/30"
                    />
                  )}
                  {formErrors.descripcion && (
                    <p className="text-sm text-red-600">{formErrors.descripcion}</p>
                  )}
                </div>
                <FieldInput
                  field={fieldByKey("enfoque_terapeutico")}
                  value={values.enfoque_terapeutico ?? ""}
                  error={formErrors.enfoque_terapeutico}
                  onChange={(v) => updateValue("enfoque_terapeutico", v)}
                />
                <FieldInput
                  field={fieldByKey("precio_consulta")}
                  value={values.precio_consulta ?? ""}
                  error={formErrors.precio_consulta}
                  onChange={(v) => updateValue("precio_consulta", v)}
                />
                <FieldInput
                  field={fieldByKey("obras_sociales")}
                  value={values.obras_sociales ?? []}
                  error={formErrors.obras_sociales}
                  onChange={(v) => updateValue("obras_sociales", v)}
                />
                <FieldInput
                  field={fieldByKey("cta_text")}
                  value={values.cta_text ?? ""}
                  error={formErrors.cta_text}
                  onChange={(v) => updateValue("cta_text", v)}
                />
              </div>
            )}

            <div className="h-20 sm:hidden" aria-hidden />
            <div className="fixed inset-x-0 bottom-0 z-30 flex gap-3 border-t border-border-subtle bg-white/95 px-5 py-3 backdrop-blur sm:static sm:z-auto sm:border-0 sm:bg-transparent sm:px-0 sm:py-0 sm:backdrop-blur-none">
              <button onClick={goBack} className={SECONDARY_BUTTON}>
                Volver
              </button>
              <button onClick={goNext} disabled={!canContinue()} className={`${PRIMARY_BUTTON} flex-1 sm:flex-none`}>
                Continuar
              </button>
            </div>
          </div>

          <div className="hidden lg:block">
            <div className="sticky top-6 overflow-y-auto overflow-x-hidden rounded-2xl border border-border-subtle shadow-sm bg-slate-100" style={{ height: "calc(100vh - 3rem)" }}>
              {/* Escala el template real para que se vea como miniatura */}
              <div ref={previewContainerRef} style={{ width: "100%", overflow: "hidden" }}>
                <div style={{ zoom: previewScale, width: "1100px", pointerEvents: "none" }}>
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
          </div>
        </div>
      )}

      {step !== "revision" && (
        <button
          onClick={() => setMobilePreviewOpen(true)}
          className="fixed bottom-24 right-5 z-40 flex h-14 items-center gap-2 rounded-full bg-navy px-5 text-sm font-medium text-white shadow-lg sm:bottom-6 sm:right-6 lg:hidden"
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
  previewFormData: PsicologoFormData;
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
            placeholder="ej: consultoriorios"
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

      {submitError && (
        <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm font-medium text-red-700">
          {submitError}
        </p>
      )}

      <div className="h-20 sm:hidden" aria-hidden />
      <div className="fixed inset-x-0 bottom-0 z-30 flex gap-3 border-t border-border-subtle bg-white/95 px-5 py-3 backdrop-blur sm:static sm:z-auto sm:border-0 sm:bg-transparent sm:px-0 sm:py-0 sm:backdrop-blur-none">
        <button onClick={onBack} className={SECONDARY_BUTTON}>
          Volver
        </button>
        <button onClick={onSubmit} disabled={isPending || !canSubmit} className={`${PRIMARY_BUTTON} flex-1 sm:flex-none`}>
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
  formData: PsicologoFormData;
  colorPrimary?: string;
  colorAccent?: string;
  subdomain: string;
}) {
  if (layout === "clasico") {
    return (
      <PsicologoClasicoTemplate
        formData={formData}
        sectionsConfig={DEFAULT_SECTIONS_CONFIG}
        subdomain={subdomain || undefined}
        colorPrimary={colorPrimary}
        colorAccent={colorAccent}
      />
    );
  }
  if (layout === "minimal") {
    return (
      <PsicologoMinimalTemplate
        formData={formData}
        sectionsConfig={DEFAULT_SECTIONS_CONFIG}
        subdomain={subdomain || undefined}
        colorPrimary={colorPrimary}
      />
    );
  }
  return (
    <PsicologoModernoTemplate
      formData={formData}
      sectionsConfig={DEFAULT_SECTIONS_CONFIG}
      subdomain={subdomain || undefined}
      colorPrimary={colorPrimary}
      colorAccent={colorAccent}
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
