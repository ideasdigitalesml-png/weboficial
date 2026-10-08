"use client";

import { useState } from "react";
import { DEFAULT_FAQ_ITEMS, type FaqItem } from "@/lib/faq-items";

export type { FaqItem };
export { DEFAULT_FAQ_ITEMS };

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
