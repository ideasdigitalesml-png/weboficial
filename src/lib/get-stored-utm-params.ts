import { ROOT_DOMAIN } from "./root-domain";
import { UTM_COOKIE_NAME, UTM_STORAGE_KEY, type UtmParams } from "./utm-cookie";

function safeParse(raw: string | null): UtmParams | null {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" ? (parsed as UtmParams) : null;
  } catch {
    return null;
  }
}

// Cookie first (the durable, cross-subdomain signal ReferralCapture writes),
// localStorage second (its same-origin fallback for when cookies fail).
// Client-only -- reads document/window directly, call only from "use client"
// code. Mirrors get-stored-referral-code.ts.
export function getStoredUtmParams(): UtmParams | null {
  const cookieMatch = document.cookie.match(
    new RegExp(`(?:^|; )${UTM_COOKIE_NAME}=([^;]*)`)
  );
  if (cookieMatch) {
    const fromCookie = safeParse(decodeURIComponent(cookieMatch[1]));
    if (fromCookie) return fromCookie;
  }

  try {
    return safeParse(window.localStorage.getItem(UTM_STORAGE_KEY));
  } catch {
    return null;
  }
}

// Called once the UTM params have been durably persisted to the landing row
// (see publish-draft.ts) so a later, unrelated visit from the same browser
// never inherits a stale campaign.
export function clearStoredUtmParams(): void {
  const domainAttr = ROOT_DOMAIN ? `; domain=.${ROOT_DOMAIN}` : "";
  document.cookie = `${UTM_COOKIE_NAME}=; max-age=0; path=/${domainAttr}; samesite=lax`;
  try {
    window.localStorage.removeItem(UTM_STORAGE_KEY);
  } catch {
    // Best-effort only -- the cookie clear above is the primary channel.
  }
}
