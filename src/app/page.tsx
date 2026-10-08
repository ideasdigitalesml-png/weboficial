import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Header } from "@/components/landing/Header";
import { Hero } from "@/components/landing/Hero";
import { AdvantagesStrip } from "@/components/landing/AdvantagesStrip";
import { TurnosShowcase } from "@/components/landing/TurnosShowcase";
import { ProfessionShowcase } from "@/components/landing/ProfessionShowcase";
import { ComparisonSection } from "@/components/landing/ComparisonSection";
import { HowItWorks } from "@/components/landing/HowItWorks";
import { DomainSection } from "@/components/landing/DomainSection";
import { PricingSection } from "@/components/landing/PricingSection";
import { FAQ } from "@/components/landing/FAQ";
import { FinalCta } from "@/components/landing/FinalCta";
import { Footer } from "@/components/landing/Footer";

export default async function Home() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // A logged-in visitor gets no value from a marketing home page --
  // /dashboard itself handles routing onward (it redirects on to
  // /onboarding for a user with no landing yet, or /reseller/dashboard for
  // an active reseller), so this is the single redirect point.
  if (user) {
    redirect("/dashboard");
  }

  return (
    <div className="relative flex flex-1 flex-col bg-white">
      <Header />
      <Hero
        previewImages={[
          { src: "/previews/contador-moderno.jpg", alt: "Ejemplo de página para contadores" },
          { src: "/previews/abogado-moderno.jpg", alt: "Ejemplo de página para abogados" },
          { src: "/previews/psicologo-moderno.jpg", alt: "Ejemplo de página para psicólogos" },
        ]}
      />
      <AdvantagesStrip />
      <ProfessionShowcase />
      <TurnosShowcase />
      <ComparisonSection />
      <HowItWorks />
      <DomainSection />
      <PricingSection />
      <FAQ />
      <FinalCta />
      <Footer />
    </div>
  );
}
