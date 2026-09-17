import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { OnboardingWizard } from "./OnboardingWizard";

export default async function OnboardingPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // The wizard itself is public now -- an anonymous visitor fills the form
  // and sees the live preview before ever signing in (see AuthModal /
  // publish-draft.ts for what happens when they click "Publicar"). A
  // signed-in user who already published shouldn't be able to re-run
  // onboarding though, so that check still applies to them specifically.
  if (user) {
    const { data: existingLanding } = await supabase
      .from("landings")
      .select("id")
      .eq("user_id", user.id)
      .maybeSingle();

    if (existingLanding) {
      redirect("/dashboard");
    }
  }

  const [{ data: professions }, { data: templates }, { data: stockImages }] =
    await Promise.all([
      supabase.from("professions").select("id, name, slug, form_schema"),
      supabase
        .from("templates")
        .select("id, profession_id, name, slug, preview_image_url, config"),
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
      isAuthenticated={Boolean(user)}
    />
  );
}
