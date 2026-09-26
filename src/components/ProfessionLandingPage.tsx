import Image from "next/image";
import { Hero } from "@/components/landing/Hero";
import { HowItWorks } from "@/components/landing/HowItWorks";
import { PricingSection } from "@/components/landing/PricingSection";
import { FinalCta } from "@/components/landing/FinalCta";
import { FAQ, type FaqItem } from "@/components/landing/FAQ";

export interface ProfessionPreviewImage {
  src: string;
  label: string;
}

export interface ProfessionLandingPageProps {
  // Plural, lowercase, used only in on-page copy ("contadores", "abogados",
  // "psicólogos") -- routing and data lookups elsewhere in the app use the
  // profession *slug*, which this component never needs.
  professionPlural: string;
  title: string;
  previewImages: ProfessionPreviewImage[];
  faqItems: FaqItem[];
}

// Shared body for the /contadores, /abogados and /psicologos landing pages.
// Each route's page.tsx supplies its own `export const metadata` (App
// Router requires that live at the page/layout level) and passes profession-
// specific copy and images in here. Reuses the exact same Hero/HowItWorks/
// FAQ/PricingSection/FinalCta components the home page renders, so any
// future edit to those stays in sync across all four pages automatically.
export function ProfessionLandingPage({
  professionPlural,
  title,
  previewImages,
  faqItems,
}: ProfessionLandingPageProps) {
  return (
    <div className="flex flex-1 flex-col bg-white">
      <Hero title={title} />

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
        </div>
      </section>

      <HowItWorks />
      <FAQ items={faqItems} />
      <PricingSection />
      <FinalCta />
    </div>
  );
}
