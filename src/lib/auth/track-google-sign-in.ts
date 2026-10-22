"use server";

import { randomUUID } from "crypto";
import { after } from "next/server";
import { cookies, headers } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendCompleteRegistrationEvent } from "@/lib/meta/capi";

// Re-homed from /auth/callback/route.ts's `code` exchange, which only ever
// ran for the redirect-OAuth flow. signInWithIdToken() establishes the
// session entirely client-side (no `code` param, no server redirect round
// trip to piggyback tracking onto), so GoogleSignInButton calls this
// server action right after signInWithIdToken() resolves successfully --
// by then the browser client has already persisted the new session as
// cookies (via @supabase/ssr), so the regular (RLS-scoped) server client
// below sees the signed-in user same as any other authenticated request.
//
// Must never be able to block or break login -- any failure here (missing
// column, network error, RLS surprise) just means the event doesn't get
// reported this time, not that the user gets stuck. Mirrors the callback
// route's logic exactly: same atomic check-and-set on
// registration_tracked_at (service-role only -- migration 0042's trigger
// silently reverts this column for any other role), same cr_eid cookie
// contract with CompleteRegistrationPixel.tsx, same Conversions API call
// deferred via after() so it never adds latency.
export async function trackGoogleSignIn(): Promise<void> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    const admin = createAdminClient();
    const { data: tracked } = await admin
      .from("profiles")
      .update({ registration_tracked_at: new Date().toISOString() })
      .eq("id", user.id)
      .is("registration_tracked_at", null)
      .select("id")
      .maybeSingle();

    if (!tracked || !user.email) return;

    const eventId = randomUUID();
    const cookieStore = await cookies();

    // Carried via cookie, not a return value -- CompleteRegistrationPixel
    // reads and clears it client-side, same contract the redirect-OAuth
    // flow already relies on.
    cookieStore.set("cr_eid", eventId, {
      maxAge: 120,
      path: "/",
      sameSite: "lax",
      httpOnly: false,
    });

    const email = user.email;
    const headerList = await headers();
    const fbp = cookieStore.get("_fbp")?.value ?? null;
    const fbc = cookieStore.get("_fbc")?.value ?? null;
    const forwardedFor = headerList.get("x-forwarded-for");
    const clientIp = forwardedFor ? forwardedFor.split(",")[0].trim() : null;
    const userAgent = headerList.get("user-agent");
    const eventSourceUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://weboficial.com.ar";

    after(() =>
      sendCompleteRegistrationEvent({
        eventId,
        email,
        eventSourceUrl,
        clientIp,
        userAgent,
        fbp,
        fbc,
      })
    );
  } catch (trackingError) {
    console.error("[track-google-sign-in] CompleteRegistration tracking failed", trackingError);
  }
}
