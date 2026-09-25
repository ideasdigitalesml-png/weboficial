import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/admin/require-admin";
import { fetchAdminList } from "@/lib/admin/queries";

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

export default async function AdminPage() {
  const supabase = await createClient();
  await requireAdmin(supabase);

  const { metrics, professionals } = await fetchAdminList(supabase);

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-1 flex-col gap-8 px-6 py-12">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Panel de administración</h1>
        <Link href="/admin/resellers" className="text-sm text-blue-600 underline dark:text-blue-400">
          Revendedores
        </Link>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <MetricTile label="Total de altas" value={metrics.totalSignups} />
        <MetricTile label="Landings activas" value={metrics.activeCount} />
        <MetricTile
          label="Landings desactivadas"
          value={metrics.deactivatedCount}
        />
        <MetricTile
          label="Ingreso mensual estimado"
          value={`$${metrics.estimatedMonthlyRevenue.toLocaleString("es-AR")}`}
        />
      </div>

      <table className="w-full text-left text-sm">
        <thead>
          <tr className="border-b border-black/[.08] text-zinc-500 dark:border-white/[.145]">
            <th className="py-2 pr-4">Nombre</th>
            <th className="py-2 pr-4">Profesión</th>
            <th className="py-2 pr-4">Slug</th>
            <th className="py-2 pr-4">Landing</th>
            <th className="py-2 pr-4">Suscripción</th>
            <th className="py-2 pr-4">Alta</th>
          </tr>
        </thead>
        <tbody>
          {professionals.map((p) => (
            <tr
              key={p.landingId}
              className="border-b border-black/[.04] dark:border-white/[.08]"
            >
              <td className="py-2 pr-4">
                <Link
                  href={`/admin/${p.landingId}`}
                  className="text-blue-600 underline dark:text-blue-400"
                >
                  {p.name ?? "(sin nombre)"}
                </Link>
              </td>
              <td className="py-2 pr-4">{p.professionName}</td>
              <td className="py-2 pr-4">{p.slug}</td>
              <td className="py-2 pr-4">
                {LANDING_STATUS_LABELS[p.landingStatus] ?? p.landingStatus}
              </td>
              <td className="py-2 pr-4">
                {p.subscriptionStatus
                  ? (SUBSCRIPTION_STATUS_LABELS[p.subscriptionStatus] ??
                    p.subscriptionStatus)
                  : "Sin suscripción"}
              </td>
              <td className="py-2 pr-4">
                {new Date(p.createdAt).toLocaleDateString("es-AR")}
              </td>
            </tr>
          ))}
          {professionals.length === 0 && (
            <tr>
              <td colSpan={6} className="py-6 text-center text-zinc-500">
                Todavía no hay profesionales registrados.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

function MetricTile({
  label,
  value,
}: {
  label: string;
  value: string | number;
}) {
  return (
    <div className="rounded-lg border border-black/[.08] p-4 dark:border-white/[.145]">
      <p className="text-xs text-zinc-500">{label}</p>
      <p className="text-xl font-semibold">{value}</p>
    </div>
  );
}
