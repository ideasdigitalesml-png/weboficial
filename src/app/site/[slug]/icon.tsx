import { getPublicLandingMeta } from "@/components/PublicLandingView";
import { getInitials } from "@/lib/landings/get-initials";
import { renderCustomerIcon } from "@/lib/landings/customer-icon";

export const size = { width: 32, height: 32 };
export const contentType = "image/png";

export default async function Icon({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const meta = await getPublicLandingMeta(slug);
  return renderCustomerIcon(meta ? getInitials(meta.name) : "•", size.width);
}
