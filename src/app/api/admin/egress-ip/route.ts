import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getFixieDispatcher } from "@/lib/resellerclub/fixie-proxy";

// Admin-only diagnostic: proves the Fixie proxy is actually wired up by
// making an outbound request through it and reporting the IP it exits on.
// That IP must match one of the two ResellerClub-allowlisted Fixie IPs
// (52.87.82.133 / 52.5.155.132) -- if it doesn't, ResellerClub calls will
// fail their IP allowlist check regardless of anything else being correct.
//
// Auth mirrors src/lib/admin/require-admin.ts's `profiles.role = 'admin'`
// check, but returns JSON instead of redirecting (this is meant to be
// curled, not browsed) -- RLS on `profiles` still applies either way.
export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "not_authenticated" }, { status: 401 });
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();
  if (!profile || profile.role !== "admin") {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  try {
    const dispatcher = getFixieDispatcher();
    const res = await fetch("https://api.ipify.org?format=json", {
      dispatcher,
    } as RequestInit & { dispatcher: ReturnType<typeof getFixieDispatcher> });

    if (!res.ok) {
      throw new Error(`egress-ip check got HTTP ${res.status}`);
    }

    const data = (await res.json()) as { ip?: string };
    return NextResponse.json({ egressIp: data.ip ?? null });
  } catch (err) {
    console.error("admin/egress-ip failed", err);
    return NextResponse.json(
      {
        error: "fixie_unavailable",
        message: err instanceof Error ? err.message : String(err),
      },
      { status: 502 }
    );
  }
}
