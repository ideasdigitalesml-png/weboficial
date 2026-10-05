import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { ROOT_DOMAIN } from "@/lib/root-domain";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { WelcomeBanner } from "./WelcomeBanner";
import { CopyLinkButton } from "./CopyLinkButton";
import { ShareWhatsAppButton } from "./ShareWhatsAppButton";
import { ChecklistCard, type ChecklistStep } from "./ChecklistCard";
import { CardPaymentBrick } from "@/components/CardPaymentBrick";
import { reconcileLandingIfStuck } from "@/lib/landings/reconcile-payment-status";
import { findActiveResellerForUser } from "@/lib/resellers/require-reseller";

// "Completar datos" step: the description field's key differs per
// profession form (contadores/abogados/psicologos each defined their wizard
// independently) -- profile_image and phone are the two consistent ones.
const DESCRIPTION_FIELD_BY_PROFESSION: Record<string, string> = {
  contadores: "description",
  abogados: "descripcion_corta",
  psicologos: "descripcion",
};

function hasCompletedProfile(
  professionSlug: string | undefined,
  formData: Record<string, unknown>
): boolean {
  const descriptionKey = professionSlug
    ? DESCRIPTION_FIELD_BY_PROFESSION[professionSlug]
    : undefined;
  const description = descriptionKey ? formData[descriptionKey] : undefined;
  return (
    Boolean(formData.profile_image) &&
    Boolean(formData.phone) &&
    typeof description === "string" &&
    description.trim().length > 0
  );
}

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
    .select("id, slug, status, form_data, profession_id, shared_at")
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

  const [{ data: profile }, { data: activePlan }, { data: profession }] = await Promise.all([
    supabase.from("profiles").select("role").eq("id", user.id).maybeSingle(),
    supabase.from("plans").select("amount").eq("active", true).limit(1).maybeSingle(),
    supabase.from("professions").select("slug").eq("id", landing.profession_id).maybeSingle(),
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

  const checklistSteps: ChecklistStep[] = [
    { label: "Creá tu página", done: true, href: "/dashboard/mi-pagina" },
    { label: "Activá tu plan", done: isPublished, href: "/dashboard/suscripcion" },
    {
      label: "Completá tus datos",
      done: hasCompletedProfile(profession?.slug, landing.form_data as Record<string, unknown>),
      href: "/dashboard/editar",
    },
    { label: "Compartí tu página", done: Boolean(landing.shared_at), href: "/dashboard" },
  ];

  return (
    <DashboardShell>
      <div className="mx-auto flex w-full max-w-[900px] flex-1 flex-col gap-6 px-5 py-6 sm:gap-8 sm:px-6 sm:py-10">
        {bienvenida === "1" && publicUrl && (
          <WelcomeBanner publicUrl={publicUrl} landingId={landing.id} />
        )}

        {/* Shown right after onboarding creates the landing as a draft
            (no publicUrl yet) -- WelcomeBanner above is for the other
            ?bienvenida=1 case, once the page is already active. */}
        {bienvenida === "1" && !publicUrl && (
          <div className="flex flex-col gap-3 rounded-xl border border-sky/30 bg-sky/5 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm font-medium text-navy">
              ¡Tu página quedó guardada! Podés recorrer el panel y editarla.
              Cuando quieras, activala para que se vea en internet.
            </p>
            <Link
              href="/dashboard/suscripcion"
              className="inline-flex shrink-0 items-center justify-center rounded-full bg-sky px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-sky-dark"
            >
              Activar mi página
            </Link>
          </div>
        )}

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

        <div>
          <h1 className="text-xl font-semibold text-navy sm:text-2xl">
            ¡Hola, {displayName}!
          </h1>
        </div>

        {/* Hero card — Tu página */}
        <section className="flex flex-col gap-4 rounded-2xl bg-navy/[.04] p-5 sm:p-6">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-sm font-medium text-navy">Tu página</p>
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
            <div className="flex flex-wrap items-center gap-2">
              <a
                href={publicUrl}
                target="_blank"
                rel="noreferrer"
                className="truncate text-sm text-sky-dark underline"
              >
                {publicUrl}
              </a>
              <CopyLinkButton url={publicUrl} landingId={landing.id} />
              <ShareWhatsAppButton url={publicUrl} landingId={landing.id} />
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
          {/* Requirement: the activation CTA must stay visible on Inicio
              (not tucked away in another section) whenever the landing is
              still a draft. */}
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

        <ChecklistCard steps={checklistSteps} />

        {/* Extra, outside the checklist/progress bar -- a custom domain is
            an upsell, not a required setup step. */}
        <section className="flex flex-col gap-3 rounded-xl border border-border-subtle p-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-medium text-navy">Extra: conseguí tu dominio propio</p>
            <p className="text-sm text-text-body">
              Reemplazá tu URL de weboficial por un dominio con tu propio nombre.
            </p>
          </div>
          <Link
            href="/dashboard/dominio"
            className="inline-flex w-fit shrink-0 items-center justify-center rounded-full border border-border-subtle px-4 py-2 text-sm font-medium text-navy transition-colors hover:border-navy/40"
          >
            Ver opciones
          </Link>
        </section>
      </div>
    </DashboardShell>
  );
}
