import { createClient } from "@/lib/supabase/server";
import { ROOT_DOMAIN } from "@/lib/root-domain";
import { requireReseller } from "@/lib/resellers/require-reseller";
import { fetchResellerDashboard } from "@/lib/resellers/queries";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { CopyReferralLinkButton } from "./CopyReferralLinkButton";
import { ClientsTable } from "./ClientsTable";
import { PayoutSection } from "./PayoutSection";

function formatMoney(amount: number): string {
  return `$${amount.toLocaleString("es-AR")}`;
}

export default async function ResellerDashboardPage() {
  const supabase = await createClient();
  const { user, reseller } = await requireReseller(supabase);

  const { clients, stats, pendingPayoutRequest, cbuAlias } =
    await fetchResellerDashboard(supabase, reseller.id);

  const referralLink = `https://${ROOT_DOMAIN}/?ref=${reseller.referralCode}`;

  return (
    <>
      <DashboardHeader email={user.email ?? ""} name={reseller.name} />
      <div className="mx-auto flex w-full max-w-[900px] flex-1 flex-col gap-6 px-5 py-6 sm:gap-8 sm:px-6 sm:py-10">
        <section className="flex flex-col gap-3 rounded-2xl bg-navy/[.04] p-5 sm:p-6">
          <div>
            <h1 className="text-xl font-semibold text-navy sm:text-2xl">
              Hola, {reseller.name}
            </h1>
            <p className="text-sm text-text-body">Panel de revendedor</p>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <a
              href={referralLink}
              target="_blank"
              rel="noreferrer"
              className="truncate text-sm text-sky-dark underline"
            >
              {referralLink}
            </a>
            <CopyReferralLinkButton url={referralLink} />
          </div>
        </section>

        <section className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div className="rounded-xl border border-border-subtle p-4">
            <p className="text-xs text-text-body">Clientes activos</p>
            <p className="text-xl font-semibold text-navy">{stats.activeClients}</p>
          </div>
          <div className="rounded-xl border border-border-subtle p-4">
            <p className="text-xs text-text-body">Comisiones este mes</p>
            <p className="text-xl font-semibold text-navy">
              {formatMoney(stats.commissionsThisMonth)}
            </p>
          </div>
          <div className="rounded-xl border border-border-subtle p-4">
            <p className="text-xs text-text-body">Saldo pendiente</p>
            <p className="text-xl font-semibold text-navy">
              {formatMoney(stats.pendingBalance)}
            </p>
          </div>
        </section>

        <section className="flex flex-col gap-3">
          <h2 className="text-lg font-semibold text-navy">Mis clientes</h2>
          <ClientsTable clients={clients} />
        </section>

        <PayoutSection
          pendingBalance={stats.pendingBalance}
          cbuAlias={cbuAlias}
          pendingPayoutRequest={pendingPayoutRequest}
        />
      </div>
    </>
  );
}
