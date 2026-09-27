// Thin wrapper over Vercel's REST API, used only to attach a freshly
// purchased custom domain to this project so it starts serving traffic
// once its nameservers (set at registration time, see
// src/lib/resellerclub/client.ts's registerDomain) finish delegating to
// Vercel. Server-only: reads VERCEL_API_TOKEN, which must never reach the
// browser. This is a project-scoped API token generated in Vercel's
// dashboard (Account Settings > Tokens) -- unrelated to the OIDC token
// the Vercel CLI/MCP integration uses locally.

// Vercel's well-known nameservers for domains it should manage DNS for
// (as opposed to keeping the domain on its registrar's DNS and pointing
// individual records at Vercel). Used both here implicitly (Vercel expects
// these once the domain is added) and by registerDomain when creating the
// domain at ResellerClub.
export const VERCEL_NAMESERVERS = ["ns1.vercel-dns.com", "ns2.vercel-dns.com"];

const VERCEL_API_BASE = "https://api.vercel.com";

function config(): { token: string; projectId: string; teamId: string } {
  const token = process.env.VERCEL_API_TOKEN;
  const projectId = process.env.VERCEL_PROJECT_ID;
  const teamId = process.env.VERCEL_TEAM_ID;
  if (!token || !projectId || !teamId) {
    throw new Error("VERCEL_API_TOKEN / VERCEL_PROJECT_ID / VERCEL_TEAM_ID is not set");
  }
  return { token, projectId, teamId };
}

async function addSingleDomain(
  domain: string,
  extra?: { redirect: string; redirectStatusCode: number }
): Promise<void> {
  const { token, projectId, teamId } = config();

  const res = await fetch(
    `${VERCEL_API_BASE}/v10/projects/${projectId}/domains?teamId=${teamId}`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ name: domain, ...extra }),
    }
  );

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Vercel add-domain API error (${res.status}) for ${domain}: ${body}`);
  }
}

// Adds both the bare domain and its "www" host, with www permanently
// (308) redirecting to the bare domain -- customers routinely type or
// share the www form, and without this it fell through to whatever the
// request's path happened to resolve to on weboficial's own project (i.e.
// weboficial's own marketing home page, not the customer's landing).
//
// No separate DNS record is needed for www: registerDomain (see this
// file's caller) delegates the domain's nameservers to Vercel's own
// (ns1/ns2.vercel-dns.com) at registration time, so Vercel is authoritative
// for the *entire* zone -- adding "www.<domain>" here is enough for Vercel
// to answer for it directly, the same as any other record in a zone it's
// authoritative for.
export async function addProjectDomain(domain: string): Promise<void> {
  await addSingleDomain(domain);
  await addSingleDomain(`www.${domain}`, { redirect: domain, redirectStatusCode: 308 });
}

// Polled by reconcile-domain-configuration.ts to find out whether Vercel
// has actually confirmed this host (NS delegation detected, so it knows
// how to answer for it) -- addProjectDomain succeeding only means Vercel
// accepted the domain into the project, not that it's verified yet.
export async function getDomainVerification(domain: string): Promise<{ verified: boolean }> {
  const { token, projectId, teamId } = config();

  const res = await fetch(
    `${VERCEL_API_BASE}/v9/projects/${projectId}/domains/${encodeURIComponent(domain)}?teamId=${teamId}`,
    { headers: { Authorization: `Bearer ${token}` } }
  );

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Vercel get-domain API error (${res.status}) for ${domain}: ${body}`);
  }

  const data = (await res.json()) as { verified?: boolean };
  return { verified: data.verified === true };
}
