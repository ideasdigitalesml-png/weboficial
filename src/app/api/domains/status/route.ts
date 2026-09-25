import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// Polled by src/app/dashboard/dominio/processing/ProcessingPoller.tsx while
// waiting for the webhook to finish (payment confirmation + ResellerClub
// registration + Vercel domain-add). RLS (custom_domains_select_own)
// already scopes this to the caller's own landing, same as every other
// query in this route -- no extra ownership check needed beyond that.
export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "not_authenticated" }, { status: 401 });
  }

  const { data: landing } = await supabase
    .from("landings")
    .select("id")
    .eq("user_id", user.id)
    .maybeSingle();
  if (!landing) {
    return NextResponse.json({ error: "no_landing" }, { status: 400 });
  }

  const { data: customDomain } = await supabase
    .from("custom_domains")
    .select("status, domain, failure_reason")
    .eq("landing_id", landing.id)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!customDomain) {
    return NextResponse.json({ status: null });
  }

  return NextResponse.json({
    status: customDomain.status,
    domain: customDomain.domain,
    failureReason: customDomain.failure_reason,
  });
}
