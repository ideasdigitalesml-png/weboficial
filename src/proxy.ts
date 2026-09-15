import { NextResponse, type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";
import { extractSubdomain } from "@/lib/tenancy/subdomain";
import { ROOT_DOMAIN } from "@/lib/root-domain";

export async function proxy(request: NextRequest) {
  const host = request.headers.get("host") ?? "";
  const subdomain = extractSubdomain(host, ROOT_DOMAIN);

  if (subdomain) {
    const url = request.nextUrl.clone();
    url.pathname = `/site/${subdomain}`;
    return updateSession(request, () => NextResponse.rewrite(url));
  }

  return updateSession(request);
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
