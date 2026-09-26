"use client";

import { useState } from "react";

export interface FaqItem {
  q: string;
  a: string;
}

// Canonical copy: kept in exact sync with what the product actually does
// (see onboarding/publish-draft.ts for "publicada al instante" and
// subscriptions/plans for "$13.400", "sin permanencia", and the
// nombre.weboficial.com.ar subdomain shape) so this section never promises
// behavior the code doesn't have.
export const DEFAULT_FAQ_ITEMS: FaqItem[] = [
  {
    q: "¿Necesito saber programación?",
    a: "No. El sistema te guía paso a paso. Solo completás tus datos y listo.",
  },
  {
    q: "¿Cuánto tarda en estar publicada mi página?",
    a: "Una vez que completás tus datos y realizás el pago, tu página queda disponible de inmediato.",
  },
  {
    q: "¿Qué URL voy a tener?",
    a: "Tu página queda disponible en tuNombre.weboficial.com.ar.",
  },
  {
    q: "¿Puedo modificar mis datos después?",
    a: "Sí, podés actualizar la información de tu página en cualquier momento desde tu panel.",
  },
  {
    q: "¿Puedo cancelar?",
    a: "Sí, sin permanencia. Cancelás cuando quieras. No hay contratos ni cargos adicionales.",
  },
  {
    q: "¿Cómo pago?",
    a: "Con Mercado Pago. Suscripción mensual de $13.400.",
  },
];

export function FAQ({ items = DEFAULT_FAQ_ITEMS }: { items?: FaqItem[] }) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <section className="px-6 py-12 sm:py-16">
      <div className="mx-auto flex w-full max-w-2xl flex-col gap-6">
        <h2 className="text-center text-3xl font-bold text-navy sm:text-4xl">
          Preguntas frecuentes
        </h2>
        <div className="flex flex-col divide-y divide-border-subtle rounded-2xl border border-border-subtle">
          {items.map((item, index) => {
            const isOpen = openIndex === index;
            return (
              <div key={item.q}>
                <button
                  type="button"
                  onClick={() => setOpenIndex(isOpen ? null : index)}
                  aria-expanded={isOpen}
                  className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left"
                >
                  <span className="font-semibold text-navy">{item.q}</span>
                  <span className="shrink-0 text-xl text-text-body">
                    {isOpen ? "–" : "+"}
                  </span>
                </button>
                {isOpen && (
                  <p className="px-5 pb-4 text-base text-text-body">{item.a}</p>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
