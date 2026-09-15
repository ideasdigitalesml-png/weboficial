import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

// TEMPORARY: 'draft' is publicly visible only until Milestone 4 ships real
// payment-driven activation. See the warning in
// supabase/migrations/0004_public_landing_read.sql.
const PUBLICLY_VISIBLE_STATUSES = new Set(["active", "draft"]);

interface LandingFormData {
  name?: string;
  professional_title?: string;
  description?: string;
  phone?: string;
  email?: string;
  profile_image?: string;
}

export default async function PublicLandingPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const supabase = await createClient();

  const { data: landing } = await supabase
    .from("landings")
    .select("form_data, status")
    .eq("internal_subdomain", slug)
    .maybeSingle();

  if (!landing || !PUBLICLY_VISIBLE_STATUSES.has(landing.status)) {
    notFound();
  }

  const formData = landing.form_data as LandingFormData;

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-6 px-6 py-12">
      {formData.profile_image && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={formData.profile_image}
          alt={formData.name ?? ""}
          className="h-32 w-32 rounded-full object-cover"
        />
      )}
      <h1 className="text-2xl font-semibold">{formData.name}</h1>
      <p className="text-zinc-500">{formData.professional_title}</p>
      <p>{formData.description}</p>
      <div className="flex flex-col gap-1 text-sm">
        {formData.phone && <p>WhatsApp: {formData.phone}</p>}
        {formData.email && <p>Email: {formData.email}</p>}
      </div>
    </div>
  );
}
