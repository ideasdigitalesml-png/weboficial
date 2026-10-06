"use client";

import { useEffect, useRef } from "react";

declare global {
  interface Window {
    fbq?: (...args: unknown[]) => void;
  }
}

function readCookie(name: string): string | null {
  const match = document.cookie
    .split("; ")
    .find((row) => row.startsWith(`${name}=`));
  return match ? decodeURIComponent(match.split("=")[1]) : null;
}

function clearCookie(name: string) {
  document.cookie = `${name}=; Max-Age=0; path=/`;
}

// Mounted once in the root layout so it applies no matter which page the
// user lands on right after login. auth/callback/route.ts sets a cr_eid
// cookie (not a query param -- query params get dropped by any
// server-side redirect() in the chain, e.g. "/" -> /dashboard) only when
// it just flipped registration_tracked_at from null, so this only ever
// fires once per user, on first login/signup.
export function CompleteRegistrationPixel() {
  const fired = useRef(false);

  useEffect(() => {
    if (fired.current) return;
    const eventId = readCookie("cr_eid");
    if (!eventId) return;
    fired.current = true;
    clearCookie("cr_eid");

    // Same event_id the server reported via Conversions API
    // (sendCompleteRegistrationEvent) so Meta dedupes the two.
    window.fbq?.("track", "CompleteRegistration", {}, { eventID: eventId });
  }, []);

  return null;
}
