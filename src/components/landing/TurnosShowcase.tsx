import { CalendarCheck, MessageSquareText, CheckCircle2 } from "lucide-react";
import { DEFAULT_LANDING_VOCAB, type LandingVocab } from "@/lib/landing-vocab";

const STEPS = [
  { icon: CalendarCheck, text: "Eligen día y hora" },
  { icon: MessageSquareText, text: "Te llega el WhatsApp con el pedido" },
  { icon: CheckCircle2, text: "Confirmás con un mensaje" },
] satisfies { icon: typeof CalendarCheck; text: string }[];

// How the real turnos feature works, in 3 steps. Used to also show a demo
// WhatsApp bubble + a "Quiero turnos por WhatsApp" CTA here, but both were
// cut for being redundant weight on a marketing page that already has
// plenty of CTAs elsewhere -- this section is now just the pitch.
// `bg-surface-muted` (not sky-50) so it takes over the "Diseños..." section's
// old slot in the white/celeste rhythm now that they've swapped order (see
// ProfessionShowcase.tsx / ProfessionLandingPage.tsx, which took this
// section's old sky-50).
export function TurnosShowcase({
  vocab = DEFAULT_LANDING_VOCAB,
}: {
  vocab?: LandingVocab;
}) {
  return (
    <section className="bg-surface-muted px-6 py-12 sm:py-16">
      <div className="mx-auto flex w-full max-w-3xl flex-col items-center gap-8">
        <div className="flex max-w-2xl flex-col items-center gap-3 text-center">
          <h2 className="text-3xl font-bold text-navy sm:text-4xl">
            Dejá de coordinar turnos por teléfono.
          </h2>
          <p className="text-base text-text-body sm:text-lg">
            Tus {vocab.clientes} eligen día y horario desde tu página y te
            llega el pedido armado a tu WhatsApp. Vos solo confirmás.
          </p>
        </div>

        <ol className="flex w-full flex-col items-center gap-6 sm:flex-row sm:items-stretch sm:justify-center sm:gap-4">
          {STEPS.map((step, index) => (
            <li
              key={step.text}
              className="flex w-full max-w-xs list-none flex-col items-center gap-2 rounded-xl bg-white p-4 text-center shadow-sm sm:flex-1"
            >
              <span className="relative flex h-9 w-9 items-center justify-center rounded-lg bg-sky/10 text-sky">
                <step.icon aria-hidden className="h-4 w-4" />
                <span className="absolute -top-1.5 -right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-sky text-[9px] font-bold text-white">
                  {index + 1}
                </span>
              </span>
              <p className="text-sm font-medium text-navy">{step.text}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
