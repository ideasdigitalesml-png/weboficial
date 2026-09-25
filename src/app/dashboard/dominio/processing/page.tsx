import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { DomainProcessingPoller } from "./DomainProcessingPoller";

export default async function DomainProcessingPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  return (
    <>
      <DashboardHeader email={user.email ?? ""} />
      <DomainProcessingPoller />
    </>
  );
}
