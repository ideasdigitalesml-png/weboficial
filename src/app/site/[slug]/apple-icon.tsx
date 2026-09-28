import { getPublicLandingMeta } from "@/components/PublicLandingView";
import { getInitials } from "@/lib/landings/get-initials";
import { renderCustomerIcon } from "@/lib/landings/customer-icon";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default async function AppleIcon({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const meta = await getPublicLandingMeta(slug);
  return renderCustomerIcon(meta ? getInitials(meta.name) : "•", size.width);
}
