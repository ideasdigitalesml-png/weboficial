// Caches domain availability + computed price per (baseName, tld) for a
// few minutes so repeated searches for the same base name don't spend
// another ResellerClub call (and another hop through the Fixie proxy's
// limited request quota) every time. Used only by /api/domains/check --
// /api/domains/purchase deliberately calls checkAvailability/getResellerCost
// directly (uncached), since it must never charge based on a price that
// could be stale by even a few minutes.
import { checkAvailability, getResellerCost } from "./client";
import { computePriceArs, type SupportedTld } from "@/lib/domains/pricing";

// Within the requested 5-10 minute window.
const TTL_MS = 7 * 60 * 1000;

export interface DomainCheckResult {
  tld: string;
  domain: string;
  available: boolean;
  priceArs: number | null;
  // Set when pricing couldn't be computed (e.g. no confirmed ResellerClub
  // product-key yet for this TLD -- see resellerclub/client.ts) even
  // though the domain itself might be available.
  priceUnavailableReason: string | null;
}

const cache = new Map<string, { value: DomainCheckResult; expiresAt: number }>();

export async function getCachedDomainChecks(
  baseName: string,
  tlds: SupportedTld[]
): Promise<DomainCheckResult[]> {
  const now = Date.now();
  const results = new Map<SupportedTld, DomainCheckResult>();
  const misses: SupportedTld[] = [];

  for (const tld of tlds) {
    const hit = cache.get(`${baseName}.${tld}`);
    if (hit && now < hit.expiresAt) {
      results.set(tld, hit.value);
    } else {
      misses.push(tld);
    }
  }

  if (misses.length > 0) {
    // Single batched availability call for every TLD that missed cache,
    // same as the pre-cache behavior -- not one call per TLD.
    const availability = await checkAvailability(baseName, misses);

    await Promise.all(
      availability.map(async (entry) => {
        const tld = entry.tld as SupportedTld;
        let value: DomainCheckResult;

        if (!entry.available) {
          value = {
            tld,
            domain: entry.domain,
            available: false,
            priceArs: null,
            priceUnavailableReason: null,
          };
        } else {
          try {
            const costUsd = await getResellerCost(tld);
            value = {
              tld,
              domain: entry.domain,
              available: true,
              priceArs: computePriceArs(costUsd, tld),
              priceUnavailableReason: null,
            };
          } catch (err) {
            console.error(`getResellerCost failed for tld=${tld}`, err);
            value = {
              tld,
              domain: entry.domain,
              available: true,
              priceArs: null,
              priceUnavailableReason: "No se pudo calcular el precio para esta extensión.",
            };
          }
        }

        cache.set(`${baseName}.${tld}`, { value, expiresAt: now + TTL_MS });
        results.set(tld, value);
      })
    );
  }

  return tlds.map((tld) => results.get(tld)!);
}
