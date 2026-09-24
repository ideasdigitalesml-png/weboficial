import { CtaButton } from "./CtaButton";

export function FinalCta() {
  return (
    <section className="px-6 py-12 sm:py-16">
      <div className="mx-auto flex w-full max-w-2xl flex-col items-center gap-6 text-center">
        <h2 className="text-3xl font-bold text-navy sm:text-4xl">
          Empezá hoy mismo
        </h2>
        <p className="text-base text-text-body sm:text-lg">
          Listo en menos de 10 minutos.
        </p>
        <CtaButton />
      </div>
    </section>
  );
}
