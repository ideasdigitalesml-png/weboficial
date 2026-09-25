import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Wordmark } from "@/components/landing/Wordmark";
import { Hero } from "@/components/landing/Hero";
import { TemplatesShowcase } from "@/components/landing/TemplatesShowcase";
import { SocialProof } from "@/components/landing/SocialProof";
import { HowItWorks } from "@/components/landing/HowItWorks";
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
      <header className="absolute inset-x-0 top-0 z-20">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-6">
          <Wordmark tone="white" className="text-lg" />
          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="inline-flex min-h-9 items-center justify-center rounded-full border border-sky-400/40 bg-sky-500/15 px-4 text-sm font-medium text-white transition-colors hover:bg-sky-500/25"
            >
              Iniciar sesión
            </Link>
            <Link
              href="/onboarding"
              className="hidden items-center justify-center gap-1.5 rounded-full bg-sky px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-sky-dark sm:inline-flex"
            >
              Creá tu página
              <span aria-hidden>→</span>
            </Link>
          </div>
        </div>
      </header>
      <Hero />
      <TemplatesShowcase />
      <SocialProof />
      <HowItWorks />
      <PricingSection />
      <FAQ />
      <FinalCta />
      <Footer />
    </div>
  );
}
