import Image from "next/image";
import Link from "next/link";
import { Header } from "@/components/landing/Header";
import { Hero, type HeroProfession } from "@/components/landing/Hero";
import { AdvantagesStrip } from "@/components/landing/AdvantagesStrip";
import { TurnosShowcase } from "@/components/landing/TurnosShowcase";
import { ComparisonSection } from "@/components/landing/ComparisonSection";
import { HowItWorks } from "@/components/landing/HowItWorks";
import { DomainSection } from "@/components/landing/DomainSection";
import { PricingSection } from "@/components/landing/PricingSection";
import { FinalCta } from "@/components/landing/FinalCta";
import { FAQ } from "@/components/landing/FAQ";
import { buildFaqItems } from "@/lib/faq-items";
import { Footer } from "@/components/landing/Footer";
import { DEFAULT_LANDING_VOCAB, type LandingVocab } from "@/lib/landing-vocab";

export interface ProfessionPreviewImage {
  src: string;
  label: string;
}

export interface ProfessionLandingPageProps {
  // Plural, lowercase, used only in on-page copy ("contadores", "abogados",
  // "psicólogos") -- routing and data lookups elsewhere in the app use the
  // profession *slug*, which this component never needs.
  professionPlural: string;
  // Profession-only eyebrow for the Hero ("Para contadores", etc.) and the
  // key that picks which demo profile the Hero's browser mockup shows.
  eyebrow: string;
  profession: HeroProfession;
  title: string;
  subtitle: string;
  previewImages: ProfessionPreviewImage[];
  // Example .com shown in the domain section, e.g. "dragarcia.com".
  exampleDomain: string;
  // Link target for this profession's single real demo page (/ejemplo/*).
  exampleHref: string;
  // Swaps "clientes"->"pacientes" and "turno"->"sesión" for /psicologos --
  // every other profession uses the default.
  vocab?: LandingVocab;
}

// Shared body for the /contadores, /abogados and /psicologos landing pages.
// Mirrors the home page's full section order and reuses every one of its
// components (Header/Hero/AdvantagesStrip/TurnosShowcase/.../Footer) so any
// future edit to those stays in sync across all four pages automatically.
// Each route's page.tsx supplies its own `export const metadata` (App
// Router requires that live at the page/layout level) plus profession-
// specific copy, images, and vocab.
export function ProfessionLandingPage({
  professionPlural,
  eyebrow,
  profession,
  title,
  subtitle,
  previewImages,
  exampleDomain,
  exampleHref,
  vocab = DEFAULT_LANDING_VOCAB,
}: ProfessionLandingPageProps) {
  return (
    <div className="relative flex flex-1 flex-col bg-white">
      <Header />
      <Hero title={title} eyebrow={eyebrow} subtitle={subtitle} profession={profession} />

      <AdvantagesStrip />
      <TurnosShowcase vocab={vocab} />

      <section className="bg-surface-muted px-6 py-12 sm:py-16">
        <div className="mx-auto flex w-full max-w-5xl flex-col gap-8">
          <h2 className="text-center text-3xl font-bold text-navy sm:text-4xl">
            Diseños disponibles para {professionPlural}
          </h2>
          <div className="grid gap-6 sm:grid-cols-3">
            {previewImages.map((image, index) => (
              <div
                key={image.src}
                className="overflow-hidden rounded-2xl border border-border-subtle bg-white shadow-sm"
              >
                <Image
                  src={image.src}
                  alt={`Diseño ${image.label} para ${professionPlural}`}
                  width={480}
                  height={300}
                  className="h-auto w-full"
                  loading={index === 0 ? undefined : "lazy"}
                  priority={index === 0}
                />
                <p className="px-4 py-3 text-center text-sm font-semibold text-navy">
                  {image.label}
                </p>
              </div>
            ))}
          </div>
          <div className="flex justify-center">
            <Link
              href={exampleHref}
              className="inline-flex items-center gap-1.5 text-base font-semibold text-sky transition-colors hover:text-sky-dark"
            >
              Ver ejemplo
              <span aria-hidden>→</span>
            </Link>
          </div>
        </div>
      </section>

      <ComparisonSection />
      <HowItWorks />
      <DomainSection exampleDomain={exampleDomain} />
      <PricingSection />
      <FAQ items={buildFaqItems(vocab)} />
      <FinalCta />
      <Footer />
    </div>
  );
}
