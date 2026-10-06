import { NextResponse, after } from "next/server";
import { randomUUID } from "crypto";
import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { resolveOrigin } from "@/lib/http/resolve-origin";
import { sendCompleteRegistrationEvent } from "@/lib/meta/capi";

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
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error && data.user) {
      const redirectTarget = `${origin}${next}`;
      const response = NextResponse.redirect(redirectTarget);

      // CompleteRegistration tracking must never be able to block or break
      // login -- any failure here (missing column, network error, RLS
      // surprise) just means the event doesn't get reported this time, not
      // that the user gets stuck.
      try {
        // Atomic check-and-set: only the one request that actually flips
        // registration_tracked_at from null to non-null reports
        // CompleteRegistration, so repeat logins never double-fire it. Must
        // use the service-role client -- the profiles table has a trigger
        // (see migration 0042) that silently reverts this column for any
        // other role, so the user's own session could never do this update.
        const admin = createAdminClient();
        const { data: tracked } = await admin
          .from("profiles")
          .update({ registration_tracked_at: new Date().toISOString() })
          .eq("id", data.user.id)
          .is("registration_tracked_at", null)
          .select("id")
          .maybeSingle();

        if (tracked && data.user.email) {
          const eventId = randomUUID();

          // Carried via cookie, not a query param -- `next` can point
          // through one or more server-side redirect() calls (e.g. "/" ->
          // /dashboard) that don't forward search params, but every one of
          // those still round-trips this Set-Cookie to the browser first.
          // CompleteRegistrationPixel reads and clears it client-side.
          response.cookies.set("cr_eid", eventId, {
            maxAge: 120,
            path: "/",
            sameSite: "lax",
            httpOnly: false,
          });

          const email = data.user.email;
          const cookieStore = await cookies();
          const fbp = cookieStore.get("_fbp")?.value ?? null;
          const fbc = cookieStore.get("_fbc")?.value ?? null;
          const forwardedFor = request.headers.get("x-forwarded-for");
          const clientIp = forwardedFor ? forwardedFor.split(",")[0].trim() : null;
          const userAgent = request.headers.get("user-agent");

          // Runs after the redirect response is sent, so the Conversions
          // API call never adds latency to the login itself.
          after(() =>
            sendCompleteRegistrationEvent({
              eventId,
              email,
              eventSourceUrl: redirectTarget,
              clientIp,
              userAgent,
              fbp,
              fbc,
            })
          );
        }
      } catch (trackingError) {
        console.error("[auth-callback] CompleteRegistration tracking failed", trackingError);
      }

      return response;
    }
  }

  return NextResponse.redirect(`${origin}/login?error=auth_callback_failed`);
}
