import Image from "next/image";
import { CtaButton } from "./CtaButton";
import { getSupportWhatsappNumber } from "@/lib/support-whatsapp";
import { PLAN_PRICE_DISPLAY } from "@/lib/pricing";

const INCLUDES = [
  "Página profesional lista en 10 minutos",
  "Turnos online directo a tu WhatsApp",
  "Botón de WhatsApp para que te escriban",
  "Ediciones ilimitadas, las hacés vos",
  "Hosting y seguridad SSL incluidos",
  "Se ve perfecto en celular",
  "Opción de tu propio .com (pago anual aparte)",
];

export function PricingSection() {
  // Same env var the floating support button reads -- if it's unset in
  // this environment, this list falls back to "Soporte por email" instead
  // of promising a WhatsApp channel that isn't wired up here.
  const hasSupportWhatsapp = Boolean(getSupportWhatsappNumber());

  return (
    <section className="px-6 py-12 sm:py-16">
      <div className="mx-auto flex w-full max-w-2xl flex-col items-center gap-6 text-center">
        <h2 className="text-3xl font-bold text-navy sm:text-4xl">
          Un precio simple. Todo incluido.
        </h2>

        <div className="flex flex-col items-center gap-1">
          <p className="font-display text-5xl font-bold text-navy sm:text-6xl">
            {PLAN_PRICE_DISPLAY}
            <span className="text-xl font-medium text-text-body"> /mes</span>
          </p>
          <p className="text-sm text-text-body/70">
            Menos de lo que cobrás por una sola consulta.
          </p>
        </div>

        <ul className="flex list-none flex-col gap-2 text-left">
          {[...INCLUDES, hasSupportWhatsapp ? "Soporte por WhatsApp" : "Soporte por email"].map(
            (item) => (
              <li key={item} className="flex items-center gap-2">
                <span className="font-bold text-sky">✓</span>
                <span className="text-base text-text-body">{item}</span>
              </li>
            )
          )}
        </ul>

        <div className="flex flex-col items-center gap-2 rounded-2xl border border-border-subtle bg-surface-muted px-6 py-4">
          <Image
            src="/icons/mercadopago.svg"
            alt="Mercado Pago"
            width={140}
            height={30}
            className="h-7 w-auto"
          />
          <p className="text-sm text-text-body">
            Pago seguro con Mercado Pago. Sin permanencia.
          </p>
        </div>

        <CtaButton />
      </div>
    </section>
  );
}
