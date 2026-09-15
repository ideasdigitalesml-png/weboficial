import { PublicLandingView } from "@/components/PublicLandingView";

export default async function PublicLandingPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  return <PublicLandingView slug={slug} />;
}
