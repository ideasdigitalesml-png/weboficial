import { X, Check } from "lucide-react";
import { CtaButton } from "./CtaButton";
import { PLAN_PRICE_PER_MONTH_DISPLAY } from "@/lib/pricing";

const DEV_ITEMS = [
  "Semanas de espera",
  "Pago inicial alto + mantenimiento",
  "Para cada cambio, le escribís y esperás",
  "Turnos online: desarrollo aparte",
  "Hosting y SSL: aparte",
];

const WEBOFICIAL_ITEMS = [
  "Lista en 10 minutos",
  `${PLAN_PRICE_PER_MONTH_DISPLAY}, todo incluido`,
  "Los cambios los hacés vos, al instante",
  "Turnos por WhatsApp incluidos",
  "Hosting y SSL incluidos",
];

// No competitor named, as instructed -- "Contratar un programador" is a
// category, not a brand. Two cards instead of a table: the muted card reads
// as the slower/costlier default, the sky-bordered elevated card as the
// one to pick -- stacked programador-first on mobile, side by side (same
// height via items-stretch) on desktop.
export function ComparisonSection() {
  return (
    <section className="bg-surface-muted px-6 py-12 sm:py-16">
      <div className="mx-auto flex w-full max-w-4xl flex-col gap-8">
        <h2 className="text-center text-3xl font-bold text-navy sm:text-4xl">
          ¿Programador o weboficial?
        </h2>

        <div className="grid items-stretch gap-6 sm:grid-cols-2">
          <div className="flex flex-col gap-4 rounded-2xl bg-slate-100 p-6">
            <h3 className="text-lg font-semibold text-slate-500">
              Contratar un programador
            </h3>
            <ul className="flex flex-col gap-3">
              {DEV_ITEMS.map((item) => (
                <li key={item} className="flex items-start gap-2 text-sm text-slate-500">
                  <X aria-hidden className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />
                  {item}
                </li>
              ))}
            </ul>
          </div>

          <div className="flex flex-col gap-4 rounded-2xl border-2 border-sky bg-white p-6 shadow-lg shadow-sky-500/10 sm:-translate-y-2">
            <h3 className="text-lg font-semibold text-navy">weboficial</h3>
            <ul className="flex flex-col gap-3">
              {WEBOFICIAL_ITEMS.map((item) => (
                <li key={item} className="flex items-start gap-2 text-sm font-medium text-navy">
                  <Check aria-hidden className="mt-0.5 h-4 w-4 shrink-0 text-sky" />
                  {item}
                </li>
              ))}
            </ul>
            <CtaButton className="mt-2 w-full" />
          </div>
        </div>
      </div>
    </section>
  );
}
