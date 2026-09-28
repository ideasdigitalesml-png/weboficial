import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ROOT_DOMAIN } from "@/lib/root-domain";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { DomainSection, type ExistingCustomDomain } from "../DomainSection";
import { reconcileConfiguringDomain } from "@/lib/domains/reconcile-domain-configuration";
import { isDomainAccessAllowed } from "@/lib/domains/domain-access";

export default async function DominioPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: landing } = await supabase
    .from("landings")
    .select("id, slug, status")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!landing) {
    redirect("/onboarding");
  }

  const [{ data: profile }, { data: subscription }, { data: customDomain }, { data: lastRegistrant }] =
    await Promise.all([
      supabase.from("profiles").select("role").eq("id", user.id).maybeSingle(),
      supabase
        .from("subscriptions")
        .select("status")
        .eq("landing_id", landing.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle(),
      supabase
        .from("custom_domains")
        .select("id, domain, status, failure_reason, expires_at")
        .eq("landing_id", landing.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle(),
      // Precompletes (never auto-applies) the registrant form with the last
      // titular this weboficial user actually used, so a repeat buyer doesn't
      // retype the same address -- but it's still editable and re-submitted
      // fresh on every purchase (see domain_registrants' migration comment).
      supabase
        .from("domain_registrants")
        .select(
          "full_name, email, phone_country_code, phone_number, address_line1, city, state, country_code, zipcode, company_name, custom_domains!inner(landing_id)"
        )
        .eq("custom_domains.landing_id", landing.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle(),
    ]);

  // Self-heals a domain stuck in "configuring" in case the customer closed
  // the post-purchase processing tab (which polls this too) before Vercel
  // finished verifying it -- a no-op unless there's actually a domain in
  // that state. See reconcileConfiguringDomain's own comment.
  if (customDomain) {
    customDomain.status = await reconcileConfiguringDomain(supabase, customDomain);
  }

  const isPublished = landing.status === "active";
  const publicUrl = isPublished && landing.slug
    ? `https://${landing.slug}.${ROOT_DOMAIN}`
    : null;

  // Precompletion source, per the priority the plan asked for: the last
  // titular this user actually registered a domain under, else whatever we
  // already know from their own profile/landing. Either way it's just a
  // starting point -- DomainSection.tsx's form is always shown and always
  // editable before paying, never silently reused.
  const defaultRegistrant = lastRegistrant
    ? {
        fullName: lastRegistrant.full_name,
        email: lastRegistrant.email,
        phoneCountryCode: lastRegistrant.phone_country_code,
        phoneNumber: lastRegistrant.phone_number,
        addressLine1: lastRegistrant.address_line1,
        city: lastRegistrant.city,
        state: lastRegistrant.state,
        countryCode: lastRegistrant.country_code,
        zipcode: lastRegistrant.zipcode,
        companyName: lastRegistrant.company_name ?? "",
      }
    : {
        fullName: "",
        email: user.email ?? "",
      };

  return (
    <DashboardShell>
      <div className="mx-auto flex w-full max-w-[900px] flex-1 flex-col gap-6 px-5 py-6 sm:gap-8 sm:px-6 sm:py-10">
        <h1 className="text-xl font-semibold text-navy sm:text-2xl">Mi dominio</h1>

        <DomainSection
          existingDomain={
            customDomain
              ? {
                  domain: customDomain.domain,
                  status: customDomain.status as ExistingCustomDomain["status"],
                  failureReason: customDomain.failure_reason,
                  expiresAt: customDomain.expires_at,
                }
              : null
          }
          defaultRegistrant={defaultRegistrant}
          purchaseEnabled={isDomainAccessAllowed(profile?.role, subscription?.status)}
          currentUrl={publicUrl}
        />
      </div>
    </DashboardShell>
  );
}
