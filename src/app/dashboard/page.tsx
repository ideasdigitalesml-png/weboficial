import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { ROOT_DOMAIN } from "@/lib/root-domain";
import type { FormSchema } from "@/lib/forms/validate-form-data";
import type { SectionConfigItem } from "@/lib/landings/update-landing";
import { SubscribeButton } from "./SubscribeButton";
import { EditLandingForm } from "./EditLandingForm";
import { SectionsEditor } from "./SectionsEditor";

const SUBSCRIPTION_STATUS_LABELS: Record<string, string> = {
  pending: "Pendiente",
  authorized: "Activa",
  paused: "Pausada",
  cancelled: "Cancelada",
};

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: landing } = await supabase
    .from("landings")
    .select("*")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!landing) {
    redirect("/onboarding");
  }

  const [
    { data: profession },
    { data: stockImages },
    { data: subscription },
    { data: profile },
  ] = await Promise.all([
    supabase
      .from("professions")
      .select("form_schema")
      .eq("id", landing.profession_id)
      .maybeSingle(),
    supabase
      .from("stock_images")
      .select("id, category, image_url")
      .eq("category", "perfil"),
    supabase
      .from("subscriptions")
      .select("status, created_at")
      .eq("landing_id", landing.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabase.from("profiles").select("role").eq("id", user.id).maybeSingle(),
  ]);

  const publicUrl = `https://${landing.slug}.${ROOT_DOMAIN}`;

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-10 px-6 py-12">
      <section className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold">Tu landing</h1>
          {profile?.role === "admin" && (
            <Link
              href="/admin"
              className="text-sm text-blue-600 underline dark:text-blue-400"
            >
              Panel de administración
            </Link>
          )}
        </div>
        <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 text-sm">
          <dt className="text-zinc-500">Subdominio</dt>
          <dd>
            {landing.slug}.{ROOT_DOMAIN}
          </dd>
          <dt className="text-zinc-500">Estado</dt>
          <dd>{landing.status}</dd>
          {landing.status === "active" && (
            <>
              <dt className="text-zinc-500">Link público</dt>
              <dd>
                <a
                  href={publicUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="text-blue-600 underline dark:text-blue-400"
                >
                  {publicUrl}
                </a>
              </dd>
            </>
          )}
          <dt className="text-zinc-500">Suscripción</dt>
          <dd>
            {subscription
              ? (SUBSCRIPTION_STATUS_LABELS[subscription.status] ??
                subscription.status)
              : "Sin suscripción"}
          </dd>
          <dt className="text-zinc-500">Creada</dt>
          <dd>{new Date(landing.created_at).toLocaleString("es-AR")}</dd>
        </dl>
        <div>
          <p className="mb-2 text-sm text-zinc-500">Datos actuales</p>
          <pre className="overflow-x-auto rounded-lg bg-black/[.04] p-4 text-xs dark:bg-white/[.06]">
            {JSON.stringify(landing.form_data, null, 2)}
          </pre>
        </div>
        {landing.status === "draft" && <SubscribeButton />}
      </section>

      {profession && (
        <EditLandingForm
          landingId={landing.id}
          formSchema={profession.form_schema as FormSchema}
          initialValues={landing.form_data as Record<string, string>}
          stockImages={stockImages ?? []}
        />
      )}

      <SectionsEditor
        landingId={landing.id}
        initialSections={landing.sections_config as SectionConfigItem[]}
      />

      <form action="/auth/signout" method="post">
        <button
          type="submit"
          className="rounded-full border border-black/[.08] px-5 py-2 text-sm dark:border-white/[.145]"
        >
          Cerrar sesión
        </button>
      </form>
    </div>
  );
}
