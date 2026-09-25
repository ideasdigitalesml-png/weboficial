import type { SupabaseClient } from "@supabase/supabase-js";
import { createAdminClient } from "@/lib/supabase/admin";
import { mercadoPagoClient } from "@/lib/mercadopago/client";
import { reconcileMissedAuthorizedPayments } from "@/lib/webhooks/process-mercadopago-webhook";

// Shared by /api/landings/status (polled by ProcessingPoller right after
// checkout) and the main /dashboard page (where a user returns later,
// possibly hours or days after closing the processing screen) -- both need
// the same self-heal for a subscription that MP authorized but whose
// approved-payment webhook never arrived (see reconcileMissedAuthorizedPayments's
// own comment for how this was confirmed happening in production).
//
// Returns the landing's current status -- unchanged if there was nothing to
// reconcile, or "active" if this call just fixed it.
export async function reconcileLandingIfStuck(
  supabase: SupabaseClient,
  landing: { id: string; status: string }
): Promise<string> {
  if (landing.status === "active") {
    return landing.status;
  }

  const { data: subscription } = await supabase
    .from("subscriptions")
    .select("id, status, mp_preapproval_id")
    .eq("landing_id", landing.id)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!subscription || subscription.status !== "authorized") {
    return landing.status;
  }

  const { data: latestPayment } = await supabase
    .from("payments")
    .select("status")
    .eq("subscription_id", subscription.id)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (latestPayment?.status === "approved") {
    // Already recorded -- landing.status being non-active here would mean
    // something else is wrong, not this gap. Leave it alone.
    return landing.status;
  }

  try {
    const { recorded } = await reconcileMissedAuthorizedPayments(
      createAdminClient(),
      mercadoPagoClient,
      subscription.mp_preapproval_id
    );
    if (!recorded) return landing.status;

    const { data: refreshed } = await supabase
      .from("landings")
      .select("status")
      .eq("id", landing.id)
      .maybeSingle();
    return refreshed?.status ?? landing.status;
  } catch (err) {
    // Best-effort -- MP hiccuping here shouldn't break the page that called
    // this, just leave the landing as it was.
    console.error("reconcileLandingIfStuck failed", err);
    return landing.status;
  }
}
