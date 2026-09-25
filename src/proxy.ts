import { NextResponse, type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";
import { extractSubdomain } from "@/lib/tenancy/subdomain";
import { ROOT_DOMAIN } from "@/lib/root-domain";
import { createAdminClient } from "@/lib/supabase/admin";

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
async function resolveCustomDomainSlug(hostname: string): Promise<string | null> {
  const { data } = await createAdminClient()
    .from("custom_domains")
    .select("slug")
    .eq("domain", hostname)
    .eq("status", "active")
    .maybeSingle();
  return data?.slug ?? null;
}

export async function proxy(request: NextRequest) {
  const host = request.headers.get("host") ?? "";
  const hostname = host.split(":")[0].toLowerCase();
  const subdomain = extractSubdomain(host, ROOT_DOMAIN);

  if (subdomain) {
    const url = request.nextUrl.clone();
    url.pathname = `/site/${subdomain}`;
    return updateSession(request, () => NextResponse.rewrite(url));
  }

  if (isCustomDomainCandidate(hostname)) {
    const slug = await resolveCustomDomainSlug(hostname);
    if (slug) {
      const url = request.nextUrl.clone();
      url.pathname = `/site/${slug}`;
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
