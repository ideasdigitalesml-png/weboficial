import { CalendarCheck, MessageSquareText, CheckCircle2 } from "lucide-react";
import { CtaButton } from "./CtaButton";
import { DEFAULT_LANDING_VOCAB, type LandingVocab } from "@/lib/landing-vocab";

const STEPS = [
  { icon: CalendarCheck, text: "Eligen día y hora" },
  { icon: MessageSquareText, text: "Te llega el WhatsApp con el pedido" },
  { icon: CheckCircle2, text: "Confirmás con un mensaje" },
] satisfies { icon: typeof CalendarCheck; text: string }[];

function WhatsAppBubble({ text }: { text: string }) {
  return (
    <div className="flex w-full max-w-[260px] flex-col gap-1.5 rounded-xl border border-border-subtle bg-[#e9f9ef] p-3 shadow-sm">
      <div className="flex items-center gap-1.5 text-[11px] font-semibold text-[#2f7a4d]">
        <svg viewBox="0 0 24 24" width="13" height="13" fill="currentColor" aria-hidden>
          <path d="M12.04 2c-5.52 0-10 4.48-10 10 0 1.77.46 3.44 1.27 4.89L2 22l5.24-1.27A9.96 9.96 0 0 0 12.04 22c5.52 0 10-4.48 10-10s-4.48-10-10-10Zm0 18.13c-1.58 0-3.06-.44-4.32-1.22l-.31-.18-3.11.76.77-3.03-.2-.32A8.07 8.07 0 0 1 3.9 12c0-4.49 3.65-8.14 8.14-8.14S20.18 7.51 20.18 12s-3.65 8.13-8.14 8.13Zm4.46-6.09c-.24-.12-1.44-.71-1.66-.79-.22-.08-.38-.12-.55.12-.16.24-.63.79-.77.95-.14.16-.28.18-.52.06-.24-.12-1.02-.38-1.94-1.2-.72-.64-1.2-1.43-1.34-1.67-.14-.24-.02-.37.11-.49.11-.11.24-.28.36-.42.12-.14.16-.24.24-.4.08-.16.04-.3-.02-.42-.06-.12-.55-1.33-.76-1.82-.2-.48-.4-.42-.55-.42-.14-.01-.3-.01-.46-.01-.16 0-.42.06-.64.3-.22.24-.84.82-.84 2s.86 2.32.98 2.48c.12.16 1.7 2.6 4.13 3.64.58.25 1.03.4 1.38.51.58.18 1.11.16 1.53.1.47-.07 1.44-.59 1.64-1.16.2-.57.2-1.06.14-1.16-.06-.1-.22-.16-.46-.28Z" />
        </svg>
        WhatsApp
      </div>
      <p className="rounded-lg bg-white px-2.5 py-1.5 text-xs text-slate-700 shadow-sm">
        {text}
      </p>
    </div>
  );
}

// The "estrella" section: how the real turnos feature works, in 3 steps,
// with a small WhatsApp-bubble mockup of the message it produces next to
// them. Used to also embed a live demo <TurnosBooking> widget here, but it
// took up too much space and didn't read well on a marketing page --
// removed from this section specifically (TurnosBooking itself is
// untouched and still used on real client landings and /ejemplo/*).
export function TurnosShowcase({
  vocab = DEFAULT_LANDING_VOCAB,
}: {
  vocab?: LandingVocab;
}) {
  return (
    <section className="bg-sky-50 px-6 py-12 sm:py-16">
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

        <WhatsAppBubble
          text={`Hola, quiero ${vocab.articuloTurno} ${vocab.turno} para el jueves 8/10 a las 09:00`}
        />

        <CtaButton>Quiero turnos por WhatsApp →</CtaButton>
      </div>
    </section>
  );
}
