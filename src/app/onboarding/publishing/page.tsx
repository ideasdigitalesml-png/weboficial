import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { PublishingClient } from "./PublishingClient";

// Landed on right after a successful Google sign-in triggered from the
// onboarding wizard's "Publicar mi página" modal (see AuthModal.tsx /
// auth/callback's ?next= handling). A session is expected to already exist
// by the time this renders -- the only way here without one is someone
// visiting the URL directly, which just bounces to /login same as any
// other authenticated route.
export default async function PublishingPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  return <PublishingClient />;
}
