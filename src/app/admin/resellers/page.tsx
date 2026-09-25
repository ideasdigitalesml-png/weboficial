import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/admin/require-admin";
import {
  fetchAdminResellerList,
  fetchPendingPayoutRequests,
} from "@/lib/admin/reseller-queries";
import { CreateResellerForm } from "./CreateResellerForm";
import { ResellerList } from "./ResellerList";
import { PayoutRequestList } from "./PayoutRequestList";

export default async function AdminResellersPage() {
  const supabase = await createClient();
  await requireAdmin(supabase);

  const [resellers, payoutRequests] = await Promise.all([
    fetchAdminResellerList(supabase),
    fetchPendingPayoutRequests(supabase),
  ]);

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-1 flex-col gap-8 px-6 py-12">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Revendedores</h1>
        <Link href="/admin" className="text-sm text-zinc-500 hover:underline">
          ← Volver al panel
        </Link>
      </div>

      <CreateResellerForm />

      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-semibold">Listado</h2>
        <ResellerList resellers={resellers} />
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-semibold">Solicitudes de pago pendientes</h2>
        <PayoutRequestList requests={payoutRequests} />
      </section>
    </div>
  );
}
