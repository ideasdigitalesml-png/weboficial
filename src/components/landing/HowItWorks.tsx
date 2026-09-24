import { Briefcase, FileEdit, CreditCard, Globe } from "lucide-react";

const STEPS = [
  {
    icon: Briefcase,
    title: "Elegís tu profesión",
    description: "Contadores, abogados y más rubros disponibles.",
  },
  {
    icon: FileEdit,
    title: "Completás tus datos",
    description: "Tu nombre, tus servicios, tus fotos. Todo en un formulario simple.",
  },
  {
    icon: CreditCard,
    title: "Pagás con Mercado Pago",
    description: "Rápido y seguro, con el medio de pago que ya conocés.",
  },
  {
    icon: Globe,
    title: "Tu página está online",
    description: "Lista para compartir con tus clientes.",
  },
];

export function HowItWorks() {
  return (
    <section className="bg-surface-muted px-6 py-12 sm:py-16">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-6 sm:gap-10">
        <h2 className="text-center text-3xl font-bold text-navy sm:text-4xl">
          Cómo funciona
        </h2>
        <ol className="grid gap-3 sm:grid-cols-2 sm:gap-6 md:grid-cols-4">
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
      </div>
    </section>
  );
}
