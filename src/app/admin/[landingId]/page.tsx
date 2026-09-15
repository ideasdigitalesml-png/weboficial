import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/admin/require-admin";
import { fetchProfessionalDetail } from "@/lib/admin/queries";

const LANDING_STATUS_LABELS: Record<string, string> = {
  draft: "Borrador",
  active: "Activa",
  deactivated: "Desactivada",
};

const SUBSCRIPTION_STATUS_LABELS: Record<string, string> = {
  pending: "Pendiente",
  authorized: "Activa",
  paused: "Pausada",
  cancelled: "Cancelada",
};

export default async function AdminLandingDetailPage({
  params,
}: {
  params: Promise<{ landingId: string }>;
}) {
  const { landingId } = await params;
  const supabase = await createClient();
  await requireAdmin(supabase);

  const detail = await fetchProfessionalDetail(supabase, landingId);
  if (!detail) {
    notFound();
  }

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-8 px-6 py-12">
      <Link href="/admin" className="text-sm text-zinc-500 hover:underline">
        ← Volver al panel
      </Link>

      <section className="flex flex-col gap-2">
        <h1 className="text-2xl font-semibold">
          {detail.landing.formData.name ?? detail.landing.slug}
        </h1>
        <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-sm">
          <dt className="text-zinc-500">Email</dt>
          <dd>{detail.ownerEmail ?? "—"}</dd>
          <dt className="text-zinc-500">Profesión</dt>
          <dd>{detail.professionName}</dd>
          <dt className="text-zinc-500">Slug</dt>
          <dd>{detail.landing.slug}</dd>
          <dt className="text-zinc-500">Estado</dt>
          <dd>
            {LANDING_STATUS_LABELS[detail.landing.status] ??
              detail.landing.status}
          </dd>
          <dt className="text-zinc-500">Alta</dt>
          <dd>{new Date(detail.landing.createdAt).toLocaleString("es-AR")}</dd>
          <dt className="text-zinc-500">Publicada</dt>
          <dd>
            {detail.landing.publishedAt
              ? new Date(detail.landing.publishedAt).toLocaleString("es-AR")
              : "—"}
          </dd>
        </dl>
      </section>

      <section className="flex flex-col gap-2">
        <h2 className="text-lg font-semibold">Suscripciones</h2>
        {detail.subscriptions.length === 0 ? (
          <p className="text-sm text-zinc-500">Sin suscripciones.</p>
        ) : (
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-black/[.08] text-zinc-500 dark:border-white/[.145]">
                <th className="py-2 pr-4">Estado</th>
                <th className="py-2 pr-4">Creada</th>
                <th className="py-2 pr-4">Actualizada</th>
              </tr>
            </thead>
            <tbody>
              {detail.subscriptions.map((s) => (
                <tr
                  key={s.id}
                  className="border-b border-black/[.04] dark:border-white/[.08]"
                >
                  <td className="py-2 pr-4">
                    {SUBSCRIPTION_STATUS_LABELS[s.status] ?? s.status}
                  </td>
                  <td className="py-2 pr-4">
                    {new Date(s.createdAt).toLocaleString("es-AR")}
                  </td>
                  <td className="py-2 pr-4">
                    {new Date(s.updatedAt).toLocaleString("es-AR")}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      <section className="flex flex-col gap-2">
        <h2 className="text-lg font-semibold">Historial de pagos</h2>
        {detail.payments.length === 0 ? (
          <p className="text-sm text-zinc-500">Sin pagos registrados.</p>
        ) : (
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-black/[.08] text-zinc-500 dark:border-white/[.145]">
                <th className="py-2 pr-4">Estado</th>
                <th className="py-2 pr-4">Monto</th>
                <th className="py-2 pr-4">Fecha</th>
              </tr>
            </thead>
            <tbody>
              {detail.payments.map((p) => (
                <tr
                  key={p.id}
                  className="border-b border-black/[.04] dark:border-white/[.08]"
                >
                  <td className="py-2 pr-4">{p.status}</td>
                  <td className="py-2 pr-4">
                    {p.currency} {p.amount.toLocaleString("es-AR")}
                  </td>
                  <td className="py-2 pr-4">
                    {new Date(p.createdAt).toLocaleString("es-AR")}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </div>
  );
}
