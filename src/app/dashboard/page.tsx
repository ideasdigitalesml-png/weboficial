import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ROOT_DOMAIN } from "@/lib/root-domain";
import { SubscribeButton } from "./SubscribeButton";

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

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-6 px-6 py-12">
      <h1 className="text-2xl font-semibold">Tu landing</h1>
      <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 text-sm">
        <dt className="text-zinc-500">Subdominio</dt>
        <dd>
          {landing.slug}.{ROOT_DOMAIN}
        </dd>
        <dt className="text-zinc-500">Estado</dt>
        <dd>{landing.status}</dd>
        <dt className="text-zinc-500">Onboarding</dt>
        <dd>{landing.onboarding_status}</dd>
        <dt className="text-zinc-500">Creada</dt>
        <dd>{new Date(landing.created_at).toLocaleString("es-AR")}</dd>
      </dl>
      <pre className="overflow-x-auto rounded-lg bg-black/[.04] p-4 text-xs dark:bg-white/[.06]">
        {JSON.stringify(landing.form_data, null, 2)}
      </pre>
      {landing.status === "draft" && <SubscribeButton />}
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
