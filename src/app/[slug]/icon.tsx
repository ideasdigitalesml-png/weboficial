import { getPublicLandingMeta } from "@/components/PublicLandingView";
import { getProfessionIconSvg } from "@/lib/landings/profession-icon";

export const contentType = "image/svg+xml";

export default async function Icon({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const meta = await getPublicLandingMeta(slug);
  const svg = await getProfessionIconSvg(meta?.professionSlug ?? null);
  return new Response(new Uint8Array(svg), { headers: { "Content-Type": contentType } });
}
