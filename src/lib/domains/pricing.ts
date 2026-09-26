// Shared by /api/domains/check and /api/domains/purchase so the price a
// visitor sees and the price actually charged always come from the exact
// same formula -- purchase never trusts a client-supplied price, it
// recomputes with this same function right before creating the MP
// preference.

// Only ".com" is sold -- ".com.ar" is deliberately not offered (see
// resellerclub/client.ts's file-level comment for why).
export const SUPPORTED_TLDS = ["com"] as const;
export type SupportedTld = (typeof SUPPORTED_TLDS)[number];

// Same base-name shape as landing slugs (RFC 1035 DNS label): lowercase
// alphanumeric, hyphens in the middle only, 1-63 chars.
const DOMAIN_BASE_RE = /^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/;

export function isValidDomainBaseName(base: string): boolean {
  return DOMAIN_BASE_RE.test(base);
}

function margin(): number {
  const raw = process.env.MARGEN_COM;
  const value = Number(raw);
  if (!raw || !Number.isFinite(value)) {
    throw new Error("MARGEN_COM is not set or invalid");
  }
  return value;
}

// ResellerClub's reseller-price.json already returns the cost in ARS (this
// reseller account's core/selling currency) -- no USD, no FX conversion.
// precio_venta = costo_resellerclub_ars * (1 + margen/100), rounded to the
// nearest peso.
export function computePriceArs(costArs: number, _tld: SupportedTld): number {
  return Math.round(costArs * (1 + margin() / 100));
}
