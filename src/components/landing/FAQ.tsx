"use client";

import { useState } from "react";

const FAQ_ITEMS = [
  {
    q: "¿Cuánto tarda en estar online mi página?",
    a: "En menos de 10 minutos. Completás el formulario, pagás con Mercado Pago y tu página queda publicada al instante.",
  },
  {
    q: "¿Qué incluye el plan?",
    a: "Tu URL propia en weboficial.com.ar, hosting, y todas las ediciones que necesites. Todo por $13.400 por mes.",
  },
  {
    q: "¿Puedo editar mis datos después?",
    a: "Sí, cuando quieras. Desde tu panel podés cambiar tu información, servicios, foto y colores sin ningún costo adicional.",
  },
  {
    q: "¿Cómo se paga?",
    a: "Con Mercado Pago, en débito automático mensual. No necesitás tarjeta de crédito.",
  },
  {
    q: "¿Qué pasa si dejo de pagar?",
    a: "Tu página se da de baja. Podés volver a activarla cuando quieras.",
  },
  {
    q: "¿Puedo cancelar en cualquier momento?",
    a: "Sí, sin permanencia ni penalidades. Cancelás desde tu panel y el cobro se corta.",
  },
  {
    q: "¿El subdominio es mío para siempre?",
    a: "Tu URL (nombre.weboficial.com.ar) está activa mientras tengas la suscripción. No incluye un dominio .com.ar propio.",
  },
  {
    q: "¿En qué profesiones está disponible?",
    a: "Hoy disponible para contadores y abogados. Próximamente más profesiones.",
  },
];

export function FAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <section className="px-6 py-12 sm:py-16">
      <div className="mx-auto flex w-full max-w-2xl flex-col gap-6">
        <h2 className="text-center text-3xl font-bold text-navy sm:text-4xl">
          Preguntas frecuentes
        </h2>
        <div className="flex flex-col divide-y divide-border-subtle rounded-2xl border border-border-subtle">
          {FAQ_ITEMS.map((item, index) => {
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
