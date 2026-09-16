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
    <section className="bg-surface-muted px-6 py-16 sm:py-24">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-12">
        <h2 className="text-center text-3xl font-bold text-navy sm:text-4xl">
          Cómo funciona
        </h2>
        <ol className="grid gap-10 sm:grid-cols-2 md:grid-cols-4">
          {STEPS.map((step, index) => (
            <li key={step.title} className="flex flex-col items-center gap-3 text-center">
              <span className="flex h-14 w-14 items-center justify-center rounded-full bg-white text-sky shadow-sm">
                <step.icon aria-hidden className="h-6 w-6" />
              </span>
              <span className="text-sm font-semibold text-sky">
                Paso {index + 1}
              </span>
              <h3 className="text-lg font-semibold text-navy">{step.title}</h3>
              <p className="text-base text-text-body">{step.description}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
