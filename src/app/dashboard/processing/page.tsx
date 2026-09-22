import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ProcessingPoller } from "./ProcessingPoller";

export default async function ProcessingPage({
  searchParams,
}: {
  searchParams: Promise<{ source?: string }>;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { source } = await searchParams;
  return <ProcessingPoller fromCardBrick={source === "brick"} />;
}
