import { getPublicLandingMeta } from "@/components/PublicLandingView";
import { getProfessionAppleIconPng } from "@/lib/landings/profession-icon";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default async function AppleIcon({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const meta = await getPublicLandingMeta(slug);
  const png = await getProfessionAppleIconPng(meta?.professionSlug ?? null);
  return new Response(new Uint8Array(png), { headers: { "Content-Type": contentType } });
}
