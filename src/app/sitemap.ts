import type { MetadataRoute } from "next";
import { ROOT_DOMAIN } from "@/lib/root-domain";

// Scoped to the root domain's own static marketing pages only -- each
// published professional page lives on its own subdomain
// (<slug>.weboficial.com.ar), a different origin from this one, so it
// can't be listed in a single sitemap served from the root domain.
export default function sitemap(): MetadataRoute.Sitemap {
  const base = `https://${ROOT_DOMAIN}`;

  return [
    { url: base, changeFrequency: "weekly", priority: 1 },
    { url: `${base}/contadores`, changeFrequency: "monthly", priority: 0.8 },
    { url: `${base}/abogados`, changeFrequency: "monthly", priority: 0.8 },
    { url: `${base}/terminos`, changeFrequency: "yearly", priority: 0.3 },
    { url: `${base}/privacidad`, changeFrequency: "yearly", priority: 0.3 },
  ];
}
