import { Palette, FileEdit, Globe } from "lucide-react";
import { CtaButton } from "./CtaButton";

// Always 3 steps now, on every page (home included) -- "Elegí tu profesión"
// was dropped from the home page too, since every page already states its
// own profession context above this section.
const STEPS = [
  {
    icon: Palette,
    title: "Elegí un diseño",
    description: "Varias plantillas pensadas para tu profesión.",
  },
  {
    icon: FileEdit,
    title: "Completá tus datos",
    description: "Nombre, servicios, fotos y horarios de atención.",
  },
  {
    icon: Globe,
    title: "Publicala",
    description:
      "Activás la suscripción con Mercado Pago y queda online al instante.",
  },
];

export function HowItWorks() {
  return (
    <section className="bg-surface-muted px-6 py-12 sm:py-16">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-6 sm:gap-10">
        <h2 className="text-center text-3xl font-bold text-navy sm:text-4xl">
          Tu página en {STEPS.length} pasos
        </h2>
        <ol className="grid gap-3 sm:grid-cols-3 sm:gap-6">
          {STEPS.map((step, index) => (
            <li
              key={step.title}
              className="flex items-center gap-3 rounded-xl bg-white p-4 shadow-sm sm:flex-col sm:items-center sm:text-center"
            >
              <span className="relative flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-sky/10 text-sky sm:h-10 sm:w-10">
                <step.icon aria-hidden className="h-4 w-4 sm:h-5 sm:w-5" />
                <span className="absolute -top-1.5 -right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-sky text-[9px] font-bold text-white">
                  {index + 1}
                </span>
              </span>
              <div className="flex flex-col gap-0.5 sm:items-center sm:gap-1">
                <h3 className="text-sm font-semibold text-navy sm:text-lg">
                  {step.title}
                </h3>
                <p className="text-xs text-text-body sm:text-base">
                  {step.description}
                </p>
              </div>
            </li>
          ))}
        </ol>
        <div className="flex flex-col items-center gap-4">
          <p className="text-sm text-text-body sm:text-base">
            Armarla y verla es gratis. Pagás solo cuando la querés publicar.
          </p>
          <CtaButton />
        </div>
      </div>
    </section>
  );
}
