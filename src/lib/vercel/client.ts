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

export async function addProjectDomain(domain: string): Promise<void> {
  const { token, projectId, teamId } = config();

  const res = await fetch(
    `${VERCEL_API_BASE}/v10/projects/${projectId}/domains?teamId=${teamId}`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ name: domain }),
    }
  );

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Vercel add-domain API error (${res.status}) for ${domain}: ${body}`);
  }
}
