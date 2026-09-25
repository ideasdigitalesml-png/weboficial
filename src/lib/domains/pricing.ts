// Shared by /api/domains/check and /api/domains/purchase so the price a
// visitor sees and the price actually charged always come from the exact
// same formula -- purchase never trusts a client-supplied price, it
// recomputes with this same function right before creating the MP
// preference.

export const SUPPORTED_TLDS = ["com", "com.ar"] as const;
export type SupportedTld = (typeof SUPPORTED_TLDS)[number];

// Same base-name shape as landing slugs (RFC 1035 DNS label): lowercase
// alphanumeric, hyphens in the middle only, 1-63 chars.
const DOMAIN_BASE_RE = /^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/;

export function isValidDomainBaseName(base: string): boolean {
  return DOMAIN_BASE_RE.test(base);
}

function marginFor(tld: SupportedTld): number {
  const envKey = tld === "com.ar" ? "MARGEN_COM_AR" : "MARGEN_COM";
  const raw = process.env[envKey];
  const margin = Number(raw);
  if (!raw || !Number.isFinite(margin)) {
    throw new Error(`${envKey} is not set or invalid`);
  }
  return margin;
}

function dolarOficial(): number {
  const raw = process.env.DOLAR_OFICIAL;
  const value = Number(raw);
  if (!raw || !Number.isFinite(value)) {
    throw new Error("DOLAR_OFICIAL is not set or invalid");
  }
  return value;
}

// precio_venta = costo_resellerclub_usd * (1 + margen/100) * DOLAR_OFICIAL,
// rounded to the nearest peso.
export function computePriceArs(costUsd: number, tld: SupportedTld): number {
  const margin = marginFor(tld);
  const fx = dolarOficial();
  return Math.round(costUsd * (1 + margin / 100) * fx);
}
