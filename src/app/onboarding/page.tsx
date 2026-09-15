import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { OnboardingWizard } from "./OnboardingWizard";

export default async function OnboardingPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: existingLanding } = await supabase
    .from("landings")
    .select("id")
    .eq("user_id", user.id)
    .maybeSingle();

  if (existingLanding) {
    redirect("/dashboard");
  }

  const [{ data: professions }, { data: templates }, { data: stockImages }] =
    await Promise.all([
      supabase.from("professions").select("id, name, slug, form_schema"),
      supabase
        .from("templates")
        .select("id, profession_id, name, slug, preview_image_url"),
      supabase
        .from("stock_images")
        .select("id, category, image_url")
        .eq("category", "perfil"),
    ]);

  return (
    <OnboardingWizard
      professions={professions ?? []}
      templates={templates ?? []}
      stockImages={stockImages ?? []}
    />
  );
}
