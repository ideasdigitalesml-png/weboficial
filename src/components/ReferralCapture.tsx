"use client";

import { useEffect } from "react";
import { ROOT_DOMAIN } from "@/lib/root-domain";
import {
  REFERRAL_COOKIE_NAME,
  REFERRAL_STORAGE_KEY,
  REFERRAL_COOKIE_MAX_AGE_SECONDS,
} from "@/lib/resellers/referral-cookie";

// Mounted once in the root layout. First-touch referral capture: a visitor
// landing on `?ref=CODIGO` gets it validated against resolve_active_reseller_id
// (public RPC, no PII) and, only if neither the cookie nor localStorage
// already holds a code, persisted to both -- a cookie for the primary,
// 30-day, cross-subdomain path, localStorage as a same-origin fallback for
// whenever cookies fail. Never overwrites an existing value: the first
// reseller a visitor ever came through keeps the commission for life.
//
// The Supabase client is imported dynamically (below), not at module scope,
// because this component mounts on every single page including the public
// marketing ones -- a static import pulled the entire @supabase/supabase-js
// graph (auth-js, realtime-js, storage-js, postgrest-js, ~250 KiB) into the
// shared bundle every visitor downloads, even the ~100% of them with no
// `?ref=` param who never reach the code below that actually needs it. A
// bundle analysis (`next experimental-analyze`) is what surfaced this as the
// single largest chunk on the home page; Lighthouse's unused-javascript
// audit had already flagged its production equivalent at 95% unused.
export function ReferralCapture() {
  useEffect(() => {
    const code = new URLSearchParams(window.location.search).get("ref");
    if (!code) return;

    const existingCookie = document.cookie.match(
      new RegExp(`(?:^|; )${REFERRAL_COOKIE_NAME}=([^;]*)`)
    );
    let existingStorage: string | null = null;
    try {
      existingStorage = window.localStorage.getItem(REFERRAL_STORAGE_KEY);
    } catch {
      // localStorage unavailable (private mode, etc.) -- cookie check above
      // is still authoritative for the first-touch guard.
    }
    if (existingCookie || existingStorage) return;

    let cancelled = false;
    import("@/lib/supabase/client").then(({ createClient }) =>
      createClient()
        .rpc("resolve_active_reseller_id", { p_referral_code: code })
        .then(({ data }) => {
          if (cancelled || !data) return;

          const normalized = code.toUpperCase();
          const domainAttr = ROOT_DOMAIN ? `; domain=.${ROOT_DOMAIN}` : "";
          document.cookie = `${REFERRAL_COOKIE_NAME}=${encodeURIComponent(normalized)}; max-age=${REFERRAL_COOKIE_MAX_AGE_SECONDS}; path=/${domainAttr}; samesite=lax`;
          try {
            window.localStorage.setItem(REFERRAL_STORAGE_KEY, normalized);
          } catch {
            // Best-effort fallback only -- the cookie above is the real store.
          }
        })
    );

    return () => {
      cancelled = true;
    };
  }, []);

  return null;
}
