import { Check, Globe2 } from "lucide-react";

// `exampleDomain` varies per profession page (e.g. "estudiocontablelopez.com"
// vs "dragarcia.com") -- see /dashboard/dominio for the real search-and-buy
// flow this previews. Purely illustrative: never a real registered domain.
export function DomainSection({
  exampleDomain = "estudiolopez.com",
}: {
  exampleDomain?: string;
}) {
  return (
    <section className="px-6 py-12 sm:py-16">
      <div className="mx-auto flex w-full max-w-3xl flex-col items-center gap-6 text-center">
        <h2 className="text-3xl font-bold text-navy sm:text-4xl">
          ¿Querés tu propio .com?
        </h2>
        <p className="max-w-xl text-base text-text-body sm:text-lg">
          Lo buscás desde tu panel, lo comprás y se conecta solo a tu página.
          Sin configurar nada, sin técnicos. Y queda a tu nombre.
        </p>

        <div className="inline-flex items-center gap-3 rounded-full border border-border-subtle bg-white px-5 py-3 shadow-sm">
          <Globe2 aria-hidden className="h-5 w-5 text-sky" />
          <span className="font-semibold text-navy">{exampleDomain}</span>
          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-600">
            <Check aria-hidden className="h-3.5 w-3.5" />
            Conectado
          </span>
        </div>

        <p className="text-sm text-text-body/70">
          Opcional. El dominio se paga una vez por año, aparte de la
          suscripción.
        </p>
      </div>
    </section>
  );
}
