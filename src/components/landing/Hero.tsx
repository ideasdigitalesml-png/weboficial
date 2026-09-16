import { Wordmark } from "./Wordmark";
import { CtaButton } from "./CtaButton";
import { MockupCard } from "./MockupCard";

// Mobile order is DOM order here (single column): wordmark, headline,
// subhead, CTA, then the mockup -- the CTA is always visible without
// scrolling. On desktop the same two blocks (text+CTA, mockup) become a
// 2-column grid with no reordering needed.
export function Hero() {
  return (
    <section className="mx-auto grid w-full max-w-5xl gap-10 px-6 pt-12 pb-16 sm:pt-16 md:grid-cols-2 md:items-center md:gap-12 md:pt-24">
      <div className="flex flex-col items-start gap-6">
        <Wordmark className="text-2xl" />
        <h1 className="text-4xl leading-tight font-bold text-navy sm:text-5xl md:text-[56px]">
          Tu página profesional, lista en minutos.
        </h1>
        <p className="text-lg text-text-body">
          Sin programar, sin complicaciones. Elegís tu diseño, completás tus
          datos y listo.
        </p>
        <CtaButton />
      </div>
      <MockupCard />
    </section>
  );
}
