import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { TemplateGallery } from "./TemplateGallery";

export default async function CambiarPlantillaPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: landing } = await supabase
    .from("landings")
    .select("id, profession_id, template_id")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!landing) {
    redirect("/onboarding");
  }

  const [{ data: profession }, { data: templates }] = await Promise.all([
    supabase
      .from("professions")
      .select("slug")
      .eq("id", landing.profession_id)
      .maybeSingle(),
    supabase
      .from("templates")
      .select("id, name, slug, preview_image_url")
      .eq("profession_id", landing.profession_id)
      .order("slug"),
  ]);

  return (
    <>
      <DashboardHeader email={user.email ?? ""} />
      <div className="mx-auto flex w-full max-w-[900px] flex-1 flex-col gap-6 px-5 py-6 sm:gap-8 sm:px-6 sm:py-10">
        <div className="flex flex-col gap-1">
          <h1 className="text-xl font-semibold text-navy sm:text-2xl">
            Cambiar plantilla
          </h1>
          <p className="text-sm text-text-body">
            Elegí un nuevo diseño para tu página. Tus datos (nombre, foto,
            descripción, especialidad) se mantienen igual, solo cambia el
            diseño visual.
          </p>
        </div>

        <TemplateGallery
          landingId={landing.id}
          professionSlug={profession?.slug ?? ""}
          templates={templates ?? []}
          currentTemplateId={landing.template_id}
        />
      </div>
    </>
  );
}
