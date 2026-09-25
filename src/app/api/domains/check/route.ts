import { NextResponse } from "next/server";
import { checkAvailability, getResellerCost } from "@/lib/resellerclub/client";
import { computePriceArs, isValidDomainBaseName, SUPPORTED_TLDS } from "@/lib/domains/pricing";

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

export async function GET(request: Request) {
  const url = new URL(request.url);
  const rawDomain = url.searchParams.get("domain")?.trim().toLowerCase() ?? "";

  // Accept either a bare base name ("miempresa") or one with a TLD already
  // typed ("miempresa.com") -- only the base name before the first dot is
  // ever used, the TLD comes from SUPPORTED_TLDS regardless.
  const baseName = rawDomain.split(".")[0] ?? "";

  if (!isValidDomainBaseName(baseName)) {
    return NextResponse.json(
      { error: "Nombre de dominio inválido." },
      { status: 400 }
    );
  }

  try {
    const availability = await checkAvailability(baseName, [...SUPPORTED_TLDS]);

    const results: DomainCheckResult[] = await Promise.all(
      availability.map(async (entry) => {
        if (!entry.available) {
          return {
            tld: entry.tld,
            domain: entry.domain,
            available: false,
            priceArs: null,
            priceUnavailableReason: null,
          };
        }

        try {
          const costUsd = await getResellerCost(entry.tld as (typeof SUPPORTED_TLDS)[number]);
          return {
            tld: entry.tld,
            domain: entry.domain,
            available: true,
            priceArs: computePriceArs(costUsd, entry.tld as (typeof SUPPORTED_TLDS)[number]),
            priceUnavailableReason: null,
          };
        } catch (err) {
          console.error(`getResellerCost failed for tld=${entry.tld}`, err);
          return {
            tld: entry.tld,
            domain: entry.domain,
            available: true,
            priceArs: null,
            priceUnavailableReason: "No se pudo calcular el precio para esta extensión.",
          };
        }
      })
    );

    return NextResponse.json({ baseName, results });
  } catch (err) {
    console.error("domains/check failed", err);
    return NextResponse.json(
      { error: "No se pudo verificar la disponibilidad. Intentá de nuevo." },
      { status: 502 }
    );
  }
}
