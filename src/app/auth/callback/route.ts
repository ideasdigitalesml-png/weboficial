import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { resolveOrigin } from "@/lib/http/resolve-origin";

export async function GET(request: Request) {
  const { searchParams, origin: requestOrigin } = new URL(request.url);
  const origin = resolveOrigin(request, requestOrigin);
  const code = searchParams.get("code");
  // `next` is attacker-controllable (it's a public query param on this
  // endpoint), so it must be a same-origin relative path, never a full URL
  // or protocol-relative one (`//evil.com`) -- otherwise this becomes an
  // open redirect. Only a single leading slash, no scheme, no backslash
  // tricks.
  const rawNext = searchParams.get("next");
  const next =
    rawNext && /^\/(?!\/|\\)/.test(rawNext) ? rawNext : "/";

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  return NextResponse.redirect(`${origin}/login?error=auth_callback_failed`);
}
