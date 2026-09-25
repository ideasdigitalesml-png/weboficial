import { ROOT_DOMAIN } from "@/lib/root-domain";
import type { ResellerClient } from "@/lib/resellers/queries";

const PAYMENT_STATUS_LABELS: Record<string, string> = {
  approved: "✅ Pagado",
  rejected: "❌ Rechazado",
  pending: "⏳ Pendiente",
  in_process: "⏳ Pendiente",
};

function paymentStatusLabel(status: string | null): string {
  if (!status) return "⏳ Sin pagos";
  return PAYMENT_STATUS_LABELS[status] ?? status;
}

// wa.me deep link is built here (not via lib/whatsapp's buildWaLink) because
// this needs a fixed nudge message baked in, not just the bare number --
// see AGENTS.md's rule against hardcoding the platform domain, hence
// ROOT_DOMAIN rather than a literal "weboficial.com.ar" in the message.
function buildPaymentReminderWaLink(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  const message = encodeURIComponent(
    `Hola! Te contacto de ${ROOT_DOMAIN} para ayudarte con el pago de tu sitio web.`
  );
  return `https://wa.me/${digits}?text=${message}`;
}

export function ClientsTable({ clients }: { clients: ResellerClient[] }) {
  if (clients.length === 0) {
    return (
      <p className="rounded-xl border border-border-subtle p-4 text-sm text-text-body">
        Todavía no tenés clientes referidos. Compartí tu link para empezar a sumar.
      </p>
    );
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-border-subtle">
      <table className="w-full text-left text-sm">
        <thead>
          <tr className="border-b border-border-subtle text-text-body">
            <th className="px-4 py-2.5">Cliente</th>
            <th className="px-4 py-2.5">Alta</th>
            <th className="px-4 py-2.5">Último pago</th>
            <th className="px-4 py-2.5"></th>
          </tr>
        </thead>
        <tbody>
          {clients.map((c) => (
            <tr key={c.landingId} className="border-b border-border-subtle last:border-0">
              <td className="px-4 py-2.5">
                <p className="font-medium text-navy">
                  {c.professionalName ?? "(sin nombre)"}
                </p>
                <p className="text-xs text-text-body">{c.professionName}</p>
              </td>
              <td className="px-4 py-2.5 whitespace-nowrap">
                {new Date(c.createdAt).toLocaleDateString("es-AR")}
              </td>
              <td className="px-4 py-2.5 whitespace-nowrap">
                {paymentStatusLabel(c.lastPaymentStatus)}
              </td>
              <td className="px-4 py-2.5">
                {c.lastPaymentStatus === "rejected" && c.phone && (
                  <a
                    href={buildPaymentReminderWaLink(c.phone)}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center justify-center rounded-full bg-emerald-600 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-emerald-700"
                  >
                    WhatsApp
                  </a>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
