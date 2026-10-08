import { CtaButton } from "./CtaButton";

export function FinalCta() {
  return (
    <section className="px-6 py-12 sm:py-16">
      <div className="mx-auto flex w-full max-w-2xl flex-col items-center gap-6 text-center">
        <h2 className="text-3xl font-bold text-navy sm:text-4xl">
          En 10 minutos podés tener tu página online.
        </h2>
        <CtaButton />
        <p className="text-sm text-text-body/70">
          Pagás con Mercado Pago · Sin permanencia
        </p>
      </div>
    </section>
  );
}
