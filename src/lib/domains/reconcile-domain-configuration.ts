import type { SupabaseClient } from "@supabase/supabase-js";
import { getDomainVerification } from "../vercel/client";

// custom_domains lands in 'configuring' once ResellerClub registration +
// the Vercel domain-add (bare + www) both succeed
// (finalize_domain_registration), but isn't 'active' until Vercel confirms
// both hosts are actually verified -- NS delegation can take minutes to a
// few hours to propagate through the .com registry, entirely outside our
// control.
//
// Called opportunistically on read, same shape as
// reconcile-payment-status.ts's reconcileLandingIfStuck: from
// /api/domains/status (polled by DomainProcessingPoller right after
// checkout) and from dashboard/page.tsx (in case the customer closes that
// tab and comes back hours later, after it was already closed). No cron
// job -- there's no action to take between checks besides asking Vercel
// again, so there's nothing a cron would do that a check-on-next-visit
// doesn't already cover, and it avoids adding scheduling infra for what's
// still a low-volume feature.
export async function reconcileConfiguringDomain(
  supabase: SupabaseClient,
  customDomain: { id: string; domain: string; status: string }
): Promise<string> {
  if (customDomain.status !== "configuring") {
    return customDomain.status;
  }

  try {
    const [bare, www] = await Promise.all([
      getDomainVerification(customDomain.domain),
      getDomainVerification(`www.${customDomain.domain}`),
    ]);
    if (!bare.verified || !www.verified) {
      return customDomain.status;
    }
  } catch (err) {
    // Best-effort -- Vercel hiccuping here shouldn't break the page that
    // called this, just leave the domain as "configuring" for next time.
    console.error(`reconcileConfiguringDomain check failed for ${customDomain.domain}`, err);
    return customDomain.status;
  }

  const { error } = await supabase.rpc("activate_verified_domain", {
    p_custom_domain_id: customDomain.id,
  });
  if (error) {
    console.error(`activate_verified_domain failed for ${customDomain.id}`, error);
    return customDomain.status;
  }
  return "active";
}
