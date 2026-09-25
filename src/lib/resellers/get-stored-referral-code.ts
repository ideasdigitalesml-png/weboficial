import {
  REFERRAL_COOKIE_NAME,
  REFERRAL_STORAGE_KEY,
} from "./referral-cookie";

// Cookie first (the durable, cross-subdomain signal ReferralCapture writes),
// localStorage second (its same-origin fallback for when cookies fail).
// Client-only -- reads document/window directly, call only from "use client"
// code.
export function getStoredReferralCode(): string | null {
  const cookieMatch = document.cookie.match(
    new RegExp(`(?:^|; )${REFERRAL_COOKIE_NAME}=([^;]*)`)
  );
  if (cookieMatch) {
    return decodeURIComponent(cookieMatch[1]);
  }

  try {
    return window.localStorage.getItem(REFERRAL_STORAGE_KEY);
  } catch {
    return null;
  }
}
