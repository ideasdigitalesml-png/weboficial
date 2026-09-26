// ResellerClub requires calls to originate from an allowlisted IP.
// Vercel's outbound IP is not static, so every ResellerClub HTTP call must
// be routed through Fixie's static-IP proxy (FIXIE_URL). This is the only
// place that constructs the proxy dispatcher -- reused by
// src/lib/resellerclub/client.ts (the only caller of the ResellerClub API)
// and by /api/admin/egress-ip (which verifies the proxy is wired correctly).
//
// Nothing else in the app should import this: Mercado Pago, Supabase, and
// Vercel API calls must keep going out on Vercel's normal network path, not
// through this proxy.
import { ProxyAgent } from "undici";

let dispatcher: ProxyAgent | null = null;

export function getFixieDispatcher(): ProxyAgent {
  if (dispatcher) return dispatcher;

  const fixieUrl = process.env.FIXIE_URL;
  if (!fixieUrl) {
    const message =
      "FIXIE_URL is not set -- ResellerClub calls require the Fixie proxy so " +
      "requests come from an IP allowlisted in ResellerClub. Refusing to call " +
      "ResellerClub directly (that would fail ResellerClub's IP allowlist anyway).";
    console.error(message);
    throw new Error(message);
  }

  dispatcher = new ProxyAgent(fixieUrl);
  return dispatcher;
}
