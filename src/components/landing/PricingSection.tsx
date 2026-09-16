import { CreditCard } from "lucide-react";

export function PricingSection() {
  return (
    <section className="px-6 py-16 sm:py-24">
      <div className="mx-auto flex w-full max-w-2xl flex-col items-center gap-6 text-center">
        <h2 className="text-3xl font-bold text-navy sm:text-4xl">
          Un precio simple, sin sorpresas
        </h2>
        <p className="font-display text-5xl font-bold text-navy sm:text-6xl">
          $25.000
          <span className="text-xl font-medium text-text-body"> /mes</span>
        </p>
        <p className="text-lg text-text-body">
          Incluye tu dominio, hosting y todas las ediciones que necesites.
        </p>
        <p className="flex items-center gap-2 text-lg font-semibold text-navy">
          <CreditCard aria-hidden className="h-5 w-5 text-sky" />
          Pagás con Mercado Pago
        </p>
        <p className="text-base text-text-body">
          Cancelá cuando quieras, sin compromiso.
        </p>
      </div>
    </section>
  );
}
