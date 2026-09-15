import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { resolveOrigin } from "@/lib/http/resolve-origin";

export async function POST(request: Request) {
  const supabase = await createClient();
  await supabase.auth.signOut();

  const origin = resolveOrigin(request, new URL(request.url).origin);
  return NextResponse.redirect(`${origin}/login`);
}
