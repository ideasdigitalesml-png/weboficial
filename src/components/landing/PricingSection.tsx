import { MercadoPagoBadge } from "./MercadoPagoBadge";

export function PricingSection() {
  return (
    <section className="px-6 py-12 sm:py-16">
      <div className="mx-auto flex w-full max-w-2xl flex-col items-center gap-6 text-center">
        <h2 className="text-3xl font-bold text-navy sm:text-4xl">
          Un precio simple, sin sorpresas
        </h2>
        <p className="font-display text-5xl font-bold text-navy sm:text-6xl">
          $13.400
          <span className="text-xl font-medium text-text-body"> /mes</span>
        </p>
        <ul className="flex list-none flex-col gap-2 text-left">
          {[
            "URL propia en weboficial.com.ar",
            "Hosting y SSL incluidos",
            "Ediciones ilimitadas",
            "Compatible con todos los dispositivos",
            "Soporte por email",
          ].map((item) => (
            <li key={item} className="flex items-center gap-2">
              <span className="font-bold text-sky">✓</span>
              <span className="text-base text-text-body">{item}</span>
            </li>
          ))}
        </ul>
        <div className="flex flex-col items-center gap-2">
          <span className="text-lg font-semibold text-navy">Pagás con</span>
          <MercadoPagoBadge />
        </div>
        <p className="text-base text-text-body">
          Cancelá cuando quieras, sin compromiso.
        </p>
      </div>
    </section>
  );
}
