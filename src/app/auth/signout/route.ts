import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { resolveOrigin } from "@/lib/http/resolve-origin";

export async function POST(request: Request) {
  const supabase = await createClient();
  await supabase.auth.signOut();

  const origin = resolveOrigin(request, new URL(request.url).origin);
  // Explicit 303: NextResponse.redirect defaults to 307, which preserves
  // the original POST method -- the browser would replay POST against
  // /login (a page, GET-only) and get a 405. 303 forces GET on redirect.
  return NextResponse.redirect(`${origin}/login`, 303);
}
