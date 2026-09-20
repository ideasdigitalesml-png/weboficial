import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { RESERVED_TOP_LEVEL_ROUTES } from "@/lib/tenancy/reserved-routes";
import { PublicLandingView, getPublicLandingMeta } from "@/components/PublicLandingView";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  if (RESERVED_TOP_LEVEL_ROUTES.has(slug)) return {};

  const meta = await getPublicLandingMeta(slug);
  if (!meta) return {};

  const title = `${meta.name} — weboficial`;
  const description = meta.description ?? "Tu página profesional, hecha con weboficial.";

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: "website",
      images: ["/og-image.png"],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
  };
}

// TEMPORARY: path-based access to a landing (weboficial.com.ar/<slug>),
// while the project doesn't have Vercel Pro's wildcard subdomain support
// yet. This coexists with (does not replace) the subdomain route --
// site/[slug], reached via the proxy.ts rewrite -- which stays the
// production path once wildcard subdomains are available.
export default async function LandingByPathPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  // Next.js already gives literal route folders (dashboard, login, etc.)
  // priority over this catch-all for their own exact path, so in practice
  // this route only ever receives a slug that isn't one of them. This check
  // is a second, explicit line of defense against that same collision --
  // it and slug.ts's RESERVED_SLUGS (which stops the slug from being
  // created in the first place) both read from the same reserved set.
  if (RESERVED_TOP_LEVEL_ROUTES.has(slug)) {
    notFound();
  }

  return <PublicLandingView slug={slug} />;
}
