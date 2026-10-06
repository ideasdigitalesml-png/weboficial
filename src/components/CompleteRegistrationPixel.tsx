"use client";

import { useEffect, useRef } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

declare global {
  interface Window {
    fbq?: (...args: unknown[]) => void;
  }
}

// Mounted once in the root layout so it applies no matter which page the
// user lands on right after login (today /dashboard?bienvenida=1 or
// /onboarding/publishing -- this intentionally doesn't hardcode either).
// auth/callback/route.ts only appends ?cr_eid=<uuid> to that first redirect
// when it just flipped registration_tracked_at from null, so this only
// ever fires once per user, on first login/signup.
export function CompleteRegistrationPixel() {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();
  const fired = useRef(false);

  useEffect(() => {
    const eventId = searchParams.get("cr_eid");
    if (!eventId || fired.current) return;
    fired.current = true;

    // Same event_id the server reported via Conversions API
    // (sendCompleteRegistrationEvent) so Meta dedupes the two.
    window.fbq?.("track", "CompleteRegistration", {}, { eventID: eventId });

    const params = new URLSearchParams(searchParams);
    params.delete("cr_eid");
    const query = params.toString();
    router.replace(query ? `${pathname}?${query}` : pathname);
  }, [searchParams, pathname, router]);

  return null;
}
