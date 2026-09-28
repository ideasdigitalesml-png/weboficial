import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { DomainProcessingPoller } from "./DomainProcessingPoller";

// Full-screen waiting state, same as /dashboard/processing's own page.tsx --
// deliberately no dashboard chrome (this is a focused "hang on while we
// confirm this" moment, not a section to navigate away from).
export default async function DomainProcessingPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  return <DomainProcessingPoller />;
}
