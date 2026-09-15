import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { SectionConfigItem } from "@/lib/landings/update-landing";

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

// Content per section id. The template (and therefore this set of section
// ids) is fixed forever once a landing is created -- sections_config can
// only reorder/hide these, never add or rename one. "services" has no
// dedicated form_data field in the MVP, so it renders nothing either way.
const SECTIONS: Record<
  string,
  (data: LandingFormData) => React.ReactNode
> = {
  hero: (data) => (
    <div className="flex flex-col items-center gap-4 text-center sm:items-start sm:text-left">
      {data.profile_image && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={data.profile_image}
          alt={data.name ?? ""}
          className="h-32 w-32 rounded-full object-cover"
        />
      )}
      <h1 className="text-2xl font-semibold">{data.name}</h1>
      <p className="text-zinc-500">{data.professional_title}</p>
    </div>
  ),
  about: (data) => (data.description ? <p>{data.description}</p> : null),
  services: () => null,
  contact: (data) => (
    <div className="flex flex-col gap-1 text-sm">
      {data.phone && <p>WhatsApp: {data.phone}</p>}
      {data.email && <p>Email: {data.email}</p>}
    </div>
  ),
};

export default async function PublicLandingPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const supabase = await createClient();

  const { data: landing } = await supabase
    .from("landings")
    .select("form_data, sections_config, status")
    .eq("internal_subdomain", slug)
    .maybeSingle();

  if (!landing || !PUBLICLY_VISIBLE_STATUSES.has(landing.status)) {
    notFound();
  }

  const formData = landing.form_data as LandingFormData;
  const sections = (landing.sections_config as SectionConfigItem[])
    .filter((s) => s.visible && SECTIONS[s.id])
    .sort((a, b) => a.order - b.order);

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-6 px-6 py-12">
      {sections.map((section) => (
        <div key={section.id}>{SECTIONS[section.id](formData)}</div>
      ))}
    </div>
  );
}
