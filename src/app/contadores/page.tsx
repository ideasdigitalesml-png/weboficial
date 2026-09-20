import type { Metadata } from "next";
import { Hero } from "@/components/landing/Hero";
import { HowItWorks } from "@/components/landing/HowItWorks";
import { PricingSection } from "@/components/landing/PricingSection";

export const metadata: Metadata = {
  title: "weboficial para contadores — Tu página profesional, lista en minutos",
  description:
    "Creá tu página como contador en minutos. Sin programar, sin complicaciones. Desde $13.400/mes con Mercado Pago.",
};

// Same page as la home, solo cambia el copy del Hero -- reusa HowItWorks y
// PricingSection tal cual para no duplicar ni desalinear ese contenido.
export default function ContadoresPage() {
  return (
    <div className="flex flex-1 flex-col bg-white">
      <Hero title="Tu página como contador, lista en minutos." />
      <HowItWorks />
      <PricingSection />
    </div>
  );
}
