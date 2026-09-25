import type { MetadataRoute } from "next";
import { ROOT_DOMAIN } from "@/lib/root-domain";

// Keeps crawlers off the authenticated app surface (dashboard, admin,
// reseller panel) and the internal onboarding flow/API routes -- none of
// it is meaningful to index, and /admin, /dashboard etc. would otherwise
// just show up as "blocked by login" results. Published professional pages
// (each on its own subdomain) and the public marketing pages are left open.
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: [
        "/dashboard",
        "/dashboard/",
        "/admin",
        "/admin/",
        "/reseller",
        "/reseller/",
        "/onboarding",
        "/onboarding/",
        "/api/",
        "/auth/",
      ],
    },
    sitemap: `https://${ROOT_DOMAIN}/sitemap.xml`,
  };
}
