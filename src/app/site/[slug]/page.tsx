import type { Metadata } from "next";
import { PublicLandingView, getPublicLandingMeta } from "@/components/PublicLandingView";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const meta = await getPublicLandingMeta(slug);
  if (!meta) return {};

  const title = `${meta.name} — weboficial`;
  const description = meta.description ?? "Tu página profesional, hecha con weboficial.";
  // Only set when this landing has an active custom domain -- otherwise
  // leave canonical/OG url unset, same as before this existed.
  const canonicalUrl = meta.customDomain ? `https://${meta.customDomain}` : undefined;

  return {
    title,
    description,
    ...(canonicalUrl ? { alternates: { canonical: canonicalUrl } } : {}),
    openGraph: {
      title,
      description,
      type: "website",
      images: ["/og-image.png"],
      ...(canonicalUrl ? { url: canonicalUrl } : {}),
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
  };
}

export default async function PublicLandingPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  return <PublicLandingView slug={slug} />;
}
