import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "not authenticated" }, { status: 401 });
  }

  const { data: landing } = await supabase
    .from("landings")
    .select("id, status")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!landing) {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }

  // While still draft, ProcessingPoller.tsx needs to tell "still waiting for
  // Mercado Pago" apart from "the charge was actually declined" -- landing
  // status alone can't do that (it only ever moves on approval, see
  // record_approved_payment), so surface the most recent payment's own
  // status too. Only relevant pre-activation; skip the extra queries once
  // the landing is already active.
  let paymentStatus: string | null = null;
  if (landing.status !== "active") {
    const { data: subscription } = await supabase
      .from("subscriptions")
      .select("id")
      .eq("landing_id", landing.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (subscription) {
      const { data: payment } = await supabase
        .from("payments")
        .select("status")
        .eq("subscription_id", subscription.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      paymentStatus = payment?.status ?? null;
    }
  }

  return NextResponse.json({ status: landing.status, paymentStatus });
}
