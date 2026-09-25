import { redirect } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { createClient } from "@/lib/supabase/server";
import { ROOT_DOMAIN } from "@/lib/root-domain";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { CONTADOR_PALETAS } from "@/lib/templates/contador-paletas";
import { ABOGADO_PALETAS } from "@/lib/templates/abogado-paletas";
import { WelcomeBanner } from "./WelcomeBanner";
import { CopyLinkButton } from "./CopyLinkButton";
import { PaletteEditor } from "./PaletteEditor";
import { DomainSection, type ExistingCustomDomain } from "./DomainSection";
import { CardPaymentBrick } from "@/components/CardPaymentBrick";
import { reconcileLandingIfStuck } from "@/lib/landings/reconcile-payment-status";
import { findActiveResellerForUser } from "@/lib/resellers/require-reseller";

const TEMPLATE_PREVIEW_IMAGE: Record<string, string> = {
  "contadores:moderno": "/previews/contador-moderno.jpg",
  "abogados:moderno": "/previews/abogado-moderno.jpg",
  "abogados:clasico": "/previews/abogado-clasico.jpg",
  "abogados:minimal": "/previews/abogado-minimal.jpg",
};

const SUBSCRIPTION_STATUS_LABELS: Record<string, string> = {
  pending: "Pendiente",
  authorized: "Activa",
  paused: "Pausada",
  cancelled: "Cancelada",
};

// Green/yellow/red at a glance, matching the same badge treatment as the
// landing status pill above -- "none" is the no-subscription (Plan
// Gratuito) case.
const SUBSCRIPTION_STATUS_BADGE: Record<string, string> = {
  authorized: "bg-emerald-100 text-emerald-700",
  pending: "bg-amber-100 text-amber-700",
  paused: "bg-amber-100 text-amber-700",
  cancelled: "bg-red-100 text-red-700",
  none: "bg-slate-100 text-slate-600",
};

const PALETAS_BY_PROFESSION: Record<string, typeof CONTADOR_PALETAS> = {
  contadores: CONTADOR_PALETAS,
  abogados: ABOGADO_PALETAS,
};

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ bienvenida?: string }>;
}) {
  const { bienvenida } = await searchParams;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Active resellers land here after login like any other user (there's no
  // separate login route) but get their own panel instead of the customer
  // dashboard. Inactive resellers fall through unchanged -- they may still
  // be a regular paying customer with their own landing.
  if (await findActiveResellerForUser(supabase, user.id)) {
    redirect("/reseller/dashboard");
  }

  const { data: landing } = await supabase
    .from("landings")
    .select("*")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!landing) {
    redirect("/onboarding");
  }

  // Self-heals the "Mercado Pago authorized the subscription but the
  // approved-payment webhook never arrived" gap -- see
  // reconcileLandingIfStuck's own comment. A no-op on every normal visit;
  // only does anything for a landing stuck in draft with an authorized
  // subscription and no recorded approved payment.
  landing.status = await reconcileLandingIfStuck(supabase, landing);

  const [
    { data: profession },
    { data: template },
    { data: subscription },
    { data: profile },
    { data: activePlan },
    { data: customDomain },
    { data: registrantContact },
  ] = await Promise.all([
    supabase
      .from("professions")
      .select("name, slug")
      .eq("id", landing.profession_id)
      .maybeSingle(),
    supabase
      .from("templates")
      .select("name, slug, preview_image_url, config")
      .eq("id", landing.template_id)
      .maybeSingle(),
    supabase
      .from("subscriptions")
      .select("status, created_at")
      .eq("landing_id", landing.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabase.from("profiles").select("role").eq("id", user.id).maybeSingle(),
    supabase.from("plans").select("amount").eq("active", true).limit(1).maybeSingle(),
    supabase
      .from("custom_domains")
      .select("domain, status, failure_reason")
      .eq("landing_id", landing.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabase.from("registrant_contacts").select("user_id").eq("user_id", user.id).maybeSingle(),
  ]);

  // Only an active landing has a working public URL: landings' public SELECT
  // RLS policy is `status = 'active'` only (0007_remove_temporary_draft_public_read.sql,
  // deliberate -- a draft shouldn't be readable by just anyone before its
  // owner has paid). Linking a draft's subdomain here would show "No
  // disponible" the moment they click it, so it's gated on payment same as
  // the badge below.
  const isPublished = landing.status === "active";
  const publicUrl = isPublished && landing.slug
    ? `https://${landing.slug}.${ROOT_DOMAIN}`
    : null;
  const professionalName =
    (landing.form_data as Record<string, unknown>)?.name;
  const displayName =
    typeof professionalName === "string" && professionalName.trim()
      ? professionalName
      : user.email;

  const templateConfig = template?.config as
    | { layout?: string }
    | undefined;
  const isModerno = templateConfig?.layout === "modern";
  const localPreviewImage = profession?.slug && template?.slug
    ? TEMPLATE_PREVIEW_IMAGE[`${profession.slug}:${template.slug}`]
    : undefined;
  const paletas = profession?.slug ? PALETAS_BY_PROFESSION[profession.slug] : undefined;

  return (
    <>
      <DashboardHeader
        email={user.email ?? ""}
        name={typeof displayName === "string" ? displayName : undefined}
      />
      <div className="mx-auto flex w-full max-w-[900px] flex-1 flex-col gap-6 px-5 py-6 sm:gap-8 sm:px-6 sm:py-10">
        {bienvenida === "1" && publicUrl && <WelcomeBanner publicUrl={publicUrl} />}

        {profile?.role === "admin" && (
          <div className="flex justify-end">
            <Link
              href="/admin"
              className="text-sm text-blue-600 underline dark:text-blue-400"
            >
              Panel de administración
            </Link>
          </div>
        )}

        {/* Hero card — Tu página */}
        <section className="flex flex-col gap-4 rounded-2xl bg-navy/[.04] p-5 sm:p-6">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0">
              <h1 className="text-xl font-semibold text-navy sm:text-2xl">{displayName}</h1>
              <p className="text-sm text-text-body">
                {profession?.name}
                {template?.name ? ` · Plantilla ${template.name}` : ""}
              </p>
            </div>
            <span
              className={`inline-flex shrink-0 items-center rounded-full px-3 py-1 text-xs font-semibold ${
                isPublished
                  ? "bg-emerald-100 text-emerald-700"
                  : "bg-amber-100 text-amber-700"
              }`}
            >
              {isPublished ? "Publicada ✓" : "Borrador"}
            </span>
          </div>
          {publicUrl ? (
            <div className="flex items-center gap-2">
              <a
                href={publicUrl}
                target="_blank"
                rel="noreferrer"
                className="truncate text-sm text-sky-dark underline"
              >
                {publicUrl}
              </a>
              <CopyLinkButton url={publicUrl} />
            </div>
          ) : (
            <p className="text-sm font-medium text-amber-700">
              {landing.slug
                ? "Tu página se publica en cuanto actives tu plan."
                : "Configurá tu sitio para obtener tu URL."}
            </p>
          )}
          <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
            <a
              href={publicUrl ?? undefined}
              target="_blank"
              rel="noreferrer"
              aria-disabled={!publicUrl}
              className={`inline-flex min-h-[52px] items-center justify-center rounded-full px-5 text-base font-semibold text-white transition-colors sm:flex-none ${
                publicUrl
                  ? "bg-sky hover:bg-sky-dark"
                  : "pointer-events-none bg-sky/40"
              }`}
            >
              Ver mi página
            </a>
            <Link
              href="/dashboard/editar"
              className="inline-flex min-h-[52px] items-center justify-center rounded-full border border-border-subtle px-5 text-base font-medium text-navy transition-colors hover:border-navy/40 sm:flex-none"
            >
              Editar mi página
            </Link>
          </div>
          {landing.status === "draft" && activePlan && (
            <div className="flex flex-col gap-3 rounded-xl border border-border-subtle p-4">
              <p className="text-sm font-medium text-navy">
                Pagar y activar mi landing — ${Number(activePlan.amount).toLocaleString("es-AR")}/mes
              </p>
              <CardPaymentBrick
                landingId={landing.id}
                amount={Number(activePlan.amount)}
                payerEmail={user.email ?? ""}
              />
            </div>
          )}
        </section>

        {/* Mi plantilla */}
        <section className="flex flex-col gap-3">
          <h2 className="text-lg font-semibold text-navy">Mi plantilla</h2>
          <div className="flex flex-col gap-3 rounded-xl border border-border-subtle p-4 sm:flex-row sm:items-center">
            {(localPreviewImage || template?.preview_image_url) && (
              <Image
                src={localPreviewImage ?? template!.preview_image_url!}
                alt={template?.name ?? "Plantilla"}
                width={160}
                height={107}
                className="h-auto w-full max-w-40 rounded-lg border border-border-subtle object-cover object-top"
                unoptimized
              />
            )}
            <div className="flex flex-1 flex-col gap-2">
              <p className="text-sm font-medium text-navy">{template?.name ?? "—"}</p>
              <p className="text-sm text-text-body">
                Tu plantilla activa. Podés{" "}
                <Link href="/dashboard/cambiar-plantilla" className="text-sky underline hover:text-sky-dark">
                  cambiarla
                </Link>{" "}
                cuando quieras.
              </p>
            </div>
          </div>
        </section>

        {/* Personalización — Paleta de colores */}
        {isModerno && paletas ? (
          <section>
            <PaletteEditor
              landingId={landing.id}
              paletas={paletas}
              initialPaletaId={landing.paleta_id ?? "bosque"}
            />
          </section>
        ) : (
          <section className="flex flex-col gap-2">
            <h2 className="text-lg font-semibold text-navy">Personalización</h2>
            <p className="text-sm text-text-body">
              La personalización de colores está disponible próximamente para
              tu plantilla.
            </p>
          </section>
        )}

        {/* Mi suscripción */}
        <section className="flex flex-col gap-3">
          <h2 className="text-lg font-semibold text-navy">Mi suscripción</h2>
          <div className="flex flex-col gap-3 rounded-xl border border-border-subtle p-4 sm:flex-row sm:items-center sm:justify-between">
            <span
              className={`inline-flex w-fit items-center rounded-full px-3 py-1 text-xs font-semibold ${
                SUBSCRIPTION_STATUS_BADGE[subscription?.status ?? "none"]
              }`}
            >
              {subscription
                ? (SUBSCRIPTION_STATUS_LABELS[subscription.status] ??
                  subscription.status)
                : "Plan Gratuito"}
            </span>
            <div className="flex flex-col gap-3 sm:flex-row">
              <Link
                href="/dashboard/plan"
                className="inline-flex min-h-11 items-center justify-center rounded-full border border-border-subtle px-4 text-sm font-medium text-navy transition-colors hover:border-navy/40"
              >
                Actualizar plan
              </Link>
              {subscription && (
                <Link
                  href="/dashboard/cancelar"
                  className="inline-flex min-h-11 items-center justify-center rounded-full px-4 text-sm font-medium text-red-600 transition-colors hover:bg-red-50"
                >
                  Cancelar suscripción
                </Link>
              )}
            </div>
          </div>
        </section>

        <DomainSection
          existingDomain={
            customDomain
              ? {
                  domain: customDomain.domain,
                  status: customDomain.status as ExistingCustomDomain["status"],
                  failureReason: customDomain.failure_reason,
                }
              : null
          }
          hasRegistrantContact={Boolean(registrantContact)}
          purchaseEnabled={process.env.DOMAIN_PURCHASE_ENABLED === "true"}
          currentUrl={publicUrl}
        />
      </div>
    </>
  );
}
