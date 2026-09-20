import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ROOT_DOMAIN } from "@/lib/root-domain";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import type { FormSchema, FormFieldValue } from "@/lib/forms/validate-form-data";
import type { SectionConfigItem } from "@/lib/landings/update-landing";
import { EditPageClient } from "./EditPageClient";

export default async function DashboardEditarPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: landing } = await supabase
    .from("landings")
    .select("*")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!landing) {
    redirect("/onboarding");
  }

  const [{ data: profession }, { data: stockImages }] = await Promise.all([
    supabase
      .from("professions")
      .select("form_schema")
      .eq("id", landing.profession_id)
      .maybeSingle(),
    supabase
      .from("stock_images")
      .select("id, category, image_url")
      .eq("category", "perfil"),
  ]);

  if (!profession) {
    redirect("/dashboard");
  }

  const publicUrl = `https://${landing.slug}.${ROOT_DOMAIN}`;

  return (
    <>
      <DashboardHeader email={user.email ?? ""} />
      <div className="mx-auto flex w-full max-w-[900px] flex-1 flex-col px-6 py-10">
        <EditPageClient
          landingId={landing.id}
          formSchema={profession.form_schema as FormSchema}
          initialValues={landing.form_data as Record<string, FormFieldValue>}
          stockImages={stockImages ?? []}
          initialSections={landing.sections_config as SectionConfigItem[]}
          publicUrl={publicUrl}
        />
      </div>
    </>
  );
}
