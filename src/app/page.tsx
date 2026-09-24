import Link from "next/link";
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

  let hasLanding = false;
  if (user) {
    const { data } = await supabase
      .from("landings")
      .select("id")
      .eq("user_id", user.id)
      .maybeSingle();
    hasLanding = Boolean(data);
  }

  if (user) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-6 bg-zinc-50 dark:bg-black">
        <p className="text-lg text-black dark:text-zinc-50">
          Sesión iniciada como <strong>{user.email}</strong>
        </p>
        <Link
          href={hasLanding ? "/dashboard" : "/onboarding"}
          className="rounded-full bg-foreground px-6 py-3 text-base font-medium text-background transition-colors hover:bg-[#383838] dark:hover:bg-[#ccc]"
        >
          {hasLanding ? "Ver mi landing" : "Crear mi landing"}
        </Link>
        <form action="/auth/signout" method="post">
          <button
            type="submit"
            className="rounded-full border border-solid border-black/[.08] px-5 py-2 text-base font-medium transition-colors hover:bg-black/[.04] dark:border-white/[.145] dark:hover:bg-[#1a1a1a]"
          >
            Cerrar sesión
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="relative flex flex-1 flex-col bg-white">
      <header className="absolute inset-x-0 top-0 z-20">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-6">
          <Wordmark tone="white" className="text-lg" />
          <Link
            href="/login"
            className="inline-flex min-h-9 items-center justify-center rounded-full border border-sky-400/40 bg-sky-500/15 px-4 text-sm font-medium text-white transition-colors hover:bg-sky-500/25"
          >
            Iniciar sesión
          </Link>
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
