import { NextResponse, type NextFetchEvent, type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";
import { extractSubdomain } from "@/lib/tenancy/subdomain";
import { ROOT_DOMAIN } from "@/lib/root-domain";
import { createAdminClient } from "@/lib/supabase/admin";
import { reconcileConfiguringDomain } from "@/lib/domains/reconcile-domain-configuration";

// Hosts that are never a custom-domain candidate even though they don't
// match *.weboficial.com.ar: the bare root domain, localhost, and Vercel's
// own preview/production aliases (*.vercel.app).
function isCustomDomainCandidate(hostname: string): boolean {
  return (
    hostname !== ROOT_DOMAIN.split(":")[0].toLowerCase() &&
    hostname !== "localhost" &&
    hostname !== "127.0.0.1" &&
    !hostname.endsWith(".vercel.app") &&
    !hostname.endsWith(".lvh.me")
  );
}

// A purchased custom domain (e.g. miempresa.com, see src/lib/resellerclub/
// client.ts + the /api/domains/* routes) has its nameservers delegated to
// Vercel, so requests for it reach this same proxy with no subdomain to
// extract. Resolved with a service-role lookup (RLS would return nothing --
// there's no session for an anonymous visitor of someone else's domain).
//
// Accepts 'configuring' as well as 'active': DNS can start actually
// resolving before our own DB record catches up (that only happens when
// someone opens the dashboard or the post-purchase processing page --
// reconcileConfiguringDomain below is this proxy's own trigger for that,
// for a customer who paid and never came back). Refusing to serve
// 'configuring' here would mean a domain that already resolves in the
// browser shows nothing until someone happens to open the dashboard.
async function resolveCustomDomainSlug(
  hostname: string
): Promise<{ id: string; slug: string; status: string } | null> {
  const { data } = await createAdminClient()
    .from("custom_domains")
    .select("id, slug, status")
    .eq("domain", hostname)
    .in("status", ["configuring", "active"])
    .maybeSingle();
  return data ?? null;
}

// Reverse of resolveCustomDomainSlug above -- once a landing's custom
// domain is active, its old <slug>.weboficial.com.ar is no longer the
// canonical address (avoids duplicate-content SEO and stops sharing the
// old link once the customer has paid for their own domain).
async function resolveActiveCustomDomainForSlug(slug: string): Promise<string | null> {
  const { data } = await createAdminClient()
    .from("custom_domains")
    .select("domain")
    .eq("slug", slug)
    .eq("status", "active")
    .maybeSingle();
  return data?.domain ?? null;
}

export async function proxy(request: NextRequest, event: NextFetchEvent) {
  const host = request.headers.get("host") ?? "";
  const hostname = host.split(":")[0].toLowerCase();
  const subdomain = extractSubdomain(host, ROOT_DOMAIN);

  if (subdomain) {
    const customDomain = await resolveActiveCustomDomainForSlug(subdomain);
    if (customDomain) {
      const url = request.nextUrl.clone();
      url.protocol = "https:";
      url.hostname = customDomain;
      url.port = "";
      return NextResponse.redirect(url, 301);
    }

    const url = request.nextUrl.clone();
    url.pathname = `/site/${subdomain}`;
    return updateSession(request, () => NextResponse.rewrite(url));
  }

  if (isCustomDomainCandidate(hostname)) {
    const customDomain = await resolveCustomDomainSlug(hostname);
    if (customDomain) {
      if (customDomain.status === "configuring") {
        // Fire-and-forget: don't hold up this visitor's response on a
        // round-trip to Vercel's API. event.waitUntil keeps the check alive
        // past the response, so it isn't killed mid-flight.
        event.waitUntil(
          reconcileConfiguringDomain(createAdminClient(), {
            id: customDomain.id,
            domain: hostname,
            status: customDomain.status,
          }).catch((err) =>
            console.error(`proxy reconcileConfiguringDomain failed for ${hostname}`, err)
          )
        );
      }

      const url = request.nextUrl.clone();
      url.pathname = `/site/${customDomain.slug}`;
      return updateSession(request, () => NextResponse.rewrite(url));
    }
  }

  return updateSession(request);
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
