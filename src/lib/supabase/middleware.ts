import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

// `buildResponse` lets callers pass a rewrite/redirect instead of the plain
// pass-through response. It must be a factory (not a single instance)
// because the cookie-refresh path below has to rebuild the response after
// attaching new cookies, and needs to reapply the same rewrite/redirect
// each time it does.
export async function updateSession(
  request: NextRequest,
  buildResponse: () => NextResponse = () => NextResponse.next({ request })
) {
  let supabaseResponse = buildResponse();

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          for (const { name, value } of cookiesToSet) {
            request.cookies.set(name, value);
          }
          supabaseResponse = buildResponse();
          for (const { name, value, options } of cookiesToSet) {
            supabaseResponse.cookies.set(name, value, options);
          }
        },
      },
    }
  );

  // Do not remove: this refreshes the auth token and must run before
  // any other logic reads the session, per @supabase/ssr's guidance.
  await supabase.auth.getUser();

  return supabaseResponse;
}
