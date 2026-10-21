"use client";

import { useEffect, useState } from "react";
import { CtaButton } from "./CtaButton";

// Mobile-only (sm:hidden below) -- shown once the Hero's own CTA scrolls
// out of view, so a visitor always has the primary action within reach
// without duplicating it on desktop, which already has room for the Hero
// button at all scroll positions. Hidden again once the FinalCta section
// comes into view, so the same button never appears twice on screen.
// Targets #hero-cta (Hero.tsx) and #final-cta (FinalCta.tsx) by id since
// this renders as a sibling of both, not an ancestor, across all four
// pages that share this header/hero/final-cta set.
export function MobileStickyCta() {
  const [heroVisible, setHeroVisible] = useState(true);
  const [finalCtaVisible, setFinalCtaVisible] = useState(false);

  useEffect(() => {
    const heroCta = document.getElementById("hero-cta");
    const finalCta = document.getElementById("final-cta");
    if (!heroCta || !finalCta) return;

    const heroObserver = new IntersectionObserver(
      ([entry]) => setHeroVisible(entry.isIntersecting),
      { threshold: 0 },
    );
    const finalCtaObserver = new IntersectionObserver(
      ([entry]) => setFinalCtaVisible(entry.isIntersecting),
      { threshold: 0 },
    );
    heroObserver.observe(heroCta);
    finalCtaObserver.observe(finalCta);

    return () => {
      heroObserver.disconnect();
      finalCtaObserver.disconnect();
    };
  }, []);

  const visible = !heroVisible && !finalCtaVisible;

  // Toggled on <body> (not scoped React state) because the floating
  // WhatsApp support button lives in the root layout, a separate subtree
  // from this component -- this is the one shared signal both can see so
  // the WhatsApp button can lift itself above this bar without overlap.
  useEffect(() => {
    document.body.classList.toggle("has-sticky-cta", visible);
    return () => document.body.classList.remove("has-sticky-cta");
  }, [visible]);

  return (
    <div
      className={`fixed inset-x-0 bottom-0 z-30 flex flex-col items-center gap-2 bg-white px-4 pt-3 shadow-[0_-4px_12px_rgba(15,31,61,0.08)] sm:hidden ${
        visible ? "" : "pointer-events-none opacity-0"
      }`}
      style={{
        paddingBottom: "calc(env(safe-area-inset-bottom, 0px) + 0.75rem)",
        transition: "opacity 0.2s ease",
      }}
      aria-hidden={!visible}
    >
      <CtaButton className="w-full" />
      <p className="text-xs text-text-body/60">
        Pagás con Mercado Pago · Cancelás cuando quieras
      </p>
    </div>
  );
}
