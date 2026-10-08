import Image from "next/image";
import { Clock, PencilLine, MessageCircle, Globe } from "lucide-react";

const ITEMS = [
  { icon: Clock, label: "Lista en 10 minutos" },
  { icon: PencilLine, label: "Sin programadores: la editás vos" },
  { icon: MessageCircle, label: "Turnos directo a tu WhatsApp" },
  { icon: Globe, label: "Tu propio .com, conectado solo" },
] as const;

// 5 items: 4 icon-led ones above, plus the Mercado Pago item (its own
// local SVG wordmark instead of a lucide icon -- see
// /public/icons/mercadopago.svg -- so this reads as a trust badge, not just
// another bullet). One row on desktop; 2-2-1 on mobile with the 5th
// (Mercado Pago) centered, per the "ventajas" spec.
export function AdvantagesStrip() {
  return (
    <section className="border-y border-border-subtle bg-white px-6 py-10">
      <div className="mx-auto grid w-full max-w-5xl grid-cols-2 gap-6 sm:grid-cols-5 sm:gap-4">
        {ITEMS.map(({ icon: Icon, label }) => (
          <div
            key={label}
            className="flex flex-col items-center gap-2 text-center"
          >
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-sky/10 text-sky">
              <Icon aria-hidden className="h-5 w-5" />
            </span>
            <p className="text-sm font-medium text-navy">{label}</p>
          </div>
        ))}
        <div className="col-span-2 flex flex-col items-center gap-2 text-center sm:col-span-1">
          <span className="flex h-10 items-center justify-center">
            <Image
              src="/icons/mercadopago.svg"
              alt="Mercado Pago"
              width={110}
              height={24}
              className="h-6 w-auto"
            />
          </span>
          <p className="text-sm font-medium text-navy">Pagás con Mercado Pago</p>
        </div>
      </div>
    </section>
  );
}
