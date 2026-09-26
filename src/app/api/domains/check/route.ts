import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getCachedDomainChecks, type DomainCheckResult } from "@/lib/resellerclub/availability-cache";
import { isValidDomainBaseName, SUPPORTED_TLDS } from "@/lib/domains/pricing";
import { checkRateLimit } from "@/lib/rate-limit";
import { checkDomainAccess } from "@/lib/domains/domain-access";

export type { DomainCheckResult };

// Only reachable by a logged-in user (DomainSection.tsx is dashboard-only)
// so the rate limit below can be keyed per user instead of per IP.
export async function GET(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "not_authenticated" }, { status: 401 });
  }

  // Business rule: only customers with an active subscription (or admins)
  // may search/buy domains. Enforced here too, not just by hiding the
  // button in DomainSection.tsx -- hiding a button doesn't stop a direct
  // request to this endpoint.
  if (!(await checkDomainAccess(supabase, user.id))) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  // Protects the Fixie proxy's ResellerClub request quota from a single
  // user hammering the search box (or a script bypassing the UI). The UI
  // itself only calls this on explicit submit, never on keystroke -- this
  // is the server-side backstop for that.
  if (!checkRateLimit(`domains-check:${user.id}`, 15, 5 * 60 * 1000)) {
    return NextResponse.json(
      { error: "Demasiadas búsquedas. Esperá un momento e intentá de nuevo." },
      { status: 429 }
    );
  }

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
    const results = await getCachedDomainChecks(baseName, [...SUPPORTED_TLDS]);
    return NextResponse.json({ baseName, results });
  } catch (err) {
    console.error("domains/check failed", err);
    return NextResponse.json(
      { error: "No se pudo verificar la disponibilidad. Intentá de nuevo." },
      { status: 502 }
    );
  }
}
