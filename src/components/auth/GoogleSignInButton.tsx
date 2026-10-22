"use client";

import { useEffect, useRef, useState } from "react";
import Script from "next/script";
import { createClient } from "@/lib/supabase/client";
import { trackGoogleSignIn } from "@/lib/auth/track-google-sign-in";

// Minimal ambient shape for the bits of Google Identity Services this file
// actually calls -- GIS ships no official npm types, and pulling in a
// third-party @types package for four methods isn't worth the dependency.
interface GoogleIdCredentialResponse {
  credential: string;
}
interface GoogleIdConfiguration {
  client_id: string;
  callback: (response: GoogleIdCredentialResponse) => void;
  nonce: string;
  use_fedcm_for_prompt?: boolean;
  itp_support?: boolean;
}
interface GoogleButtonConfiguration {
  type?: "standard" | "icon";
  theme?: "outline" | "filled_blue" | "filled_black";
  size?: "large" | "medium" | "small";
  text?: "signin_with" | "signup_with" | "continue_with" | "signin";
  shape?: "rectangular" | "pill" | "circle" | "square";
  logo_alignment?: "left" | "center";
  width?: number;
  locale?: string;
}
declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: GoogleIdConfiguration) => void;
          renderButton: (parent: HTMLElement, options: GoogleButtonConfiguration) => void;
          prompt: () => void;
          cancel: () => void;
        };
      };
    };
  }
}

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden="true">
      <path
        fill="#4285F4"
        d="M23.52 12.27c0-.85-.08-1.67-.22-2.45H12v4.64h6.47a5.53 5.53 0 0 1-2.4 3.63v3h3.87c2.27-2.09 3.58-5.17 3.58-8.82Z"
      />
      <path
        fill="#34A853"
        d="M12 24c3.24 0 5.96-1.07 7.94-2.91l-3.87-3c-1.08.72-2.45 1.15-4.07 1.15-3.13 0-5.78-2.11-6.73-4.96H1.27v3.11A12 12 0 0 0 12 24Z"
      />
      <path
        fill="#FBBC05"
        d="M5.27 14.28A7.2 7.2 0 0 1 4.89 12c0-.79.14-1.56.38-2.28V6.61H1.27A12 12 0 0 0 0 12c0 1.94.46 3.77 1.27 5.39l4-3.11Z"
      />
      <path
        fill="#EA4335"
        d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0A12 12 0 0 0 1.27 6.61l4 3.11C6.22 6.86 8.87 4.75 12 4.75Z"
      />
    </svg>
  );
}

// crypto.subtle.digest needs a byte buffer, not the raw string -- this is
// Google's own documented recipe for pairing GIS with a server-verified ID
// token (and the one Supabase's signInWithIdToken docs mirror verbatim):
// the RAW nonce goes to Supabase, the SHA-256 HEX digest of that same raw
// string goes to Google. Supabase re-hashes whatever raw nonce it's given
// and checks it matches the `nonce` claim baked into the ID token Google
// returns, so the two must be derived from each other exactly like this.
async function generateNonce(): Promise<{ raw: string; hashed: string }> {
  const rawBytes = crypto.getRandomValues(new Uint8Array(32));
  const raw = btoa(String.fromCharCode(...rawBytes));
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(raw));
  const hashed = Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
  return { raw, hashed };
}

// Reusable "Sign in with Google" entry point for /login and the onboarding
// wizard's AuthModal. Renders Google's own official button (via GIS'
// renderButton, not a hand-rolled one) and completes sign-in with
// supabase.auth.signInWithIdToken() entirely client-side -- no redirect
// through accounts.google.com, which is what let Google's account-chooser
// screen show weboficial.com.ar instead of the Supabase project's own
// *.supabase.co domain. Falls back to the previous signInWithOAuth redirect
// flow (still fully intact, see /auth/callback) whenever GIS can't load --
// a blocked script, a missing client ID, or any runtime error -- so no
// visitor is ever left unable to log in.
export function GoogleSignInButton({
  redirectTo,
  oneTap = false,
  className = "",
}: {
  // Where the browser navigates after a successful sign-in. Used both as
  // the ID-token flow's client-side destination and as the fallback
  // redirect flow's `?next=` target, so both paths land in the same place.
  redirectTo: string;
  oneTap?: boolean;
  className?: string;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const nonceRef = useRef<{ raw: string; hashed: string } | null>(null);
  const initializedRef = useRef(false);
  const [useFallback, setUseFallback] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fallbackPending, setFallbackPending] = useState(false);

  const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;

  // No client ID configured yet -- known synchronously from process.env
  // (not an external/async source), so this is a plain derived value, not
  // effect+state: falls back immediately rather than loading a script that
  // can never actually sign anyone in.
  const showFallback = useFallback || !clientId;

  useEffect(() => {
    if (!clientId) return;
    // The GIS script dedupes by src across every mounted <Script> instance
    // (e.g. /login's button, then AuthModal's later in the same session) --
    // if a previous instance already loaded it, this one's onLoad below
    // never fires, so check for the already-loaded case directly too.
    // initializeGis() itself is idempotent (guarded by initializedRef), so
    // calling it from both this effect and onLoad is harmless.
    if (window.google) {
      initializeGis();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clientId]);

  async function handleCredentialResponse(response: GoogleIdCredentialResponse) {
    const nonce = nonceRef.current;
    if (!nonce) return;
    setError(null);
    try {
      const supabase = createClient();
      const { error: signInError } = await supabase.auth.signInWithIdToken({
        provider: "google",
        token: response.credential,
        nonce: nonce.raw,
      });
      if (signInError) {
        setError("No se pudo iniciar sesión. Probá de nuevo.");
        return;
      }
      // Fire-and-forget-ish: awaited so the cr_eid cookie is set before the
      // navigation below, but a failure here must never block login (see
      // trackGoogleSignIn's own try/catch).
      await trackGoogleSignIn();
      window.location.assign(redirectTo);
    } catch {
      setError("No se pudo iniciar sesión. Probá de nuevo.");
    }
  }

  async function initializeGis() {
    if (initializedRef.current || !containerRef.current || !clientId) return;
    try {
      const nonce = await generateNonce();
      nonceRef.current = nonce;

      if (!window.google) throw new Error("GIS script loaded but window.google is missing");

      initializedRef.current = true;
      window.google.accounts.id.initialize({
        client_id: clientId,
        callback: handleCredentialResponse,
        nonce: nonce.hashed,
        use_fedcm_for_prompt: true,
        itp_support: true,
      });

      const width = Math.min(400, Math.max(200, containerRef.current.offsetWidth || 300));
      window.google.accounts.id.renderButton(containerRef.current, {
        type: "standard",
        theme: "outline",
        size: "large",
        text: "continue_with",
        shape: "pill",
        logo_alignment: "left",
        width,
        locale: "es",
      });

      // One Tap has its own built-in "don't nag" cooldown once a visitor
      // dismisses it (tracked via Google's g_state cookie) -- calling
      // prompt() once per mount is enough, no retry logic needed here.
      if (oneTap) {
        window.google.accounts.id.prompt();
      }
    } catch (err) {
      console.error("[GoogleSignInButton] GIS init failed", err);
      setUseFallback(true);
    }
  }

  async function handleFallbackRedirect() {
    setFallbackPending(true);
    setError(null);
    const supabase = createClient();
    const { error: oauthError } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(redirectTo)}`,
      },
    });
    if (oauthError) {
      setError("No se pudo iniciar el login. Intentá de nuevo.");
      setFallbackPending(false);
    }
    // No error: the browser is already navigating to Google.
  }

  if (showFallback) {
    return (
      <div className={`flex flex-col gap-2 ${className}`}>
        <button
          type="button"
          onClick={handleFallbackRedirect}
          disabled={fallbackPending}
          className="flex min-h-[52px] w-full items-center justify-center gap-3 rounded-xl border-2 border-border-subtle bg-white px-6 text-base font-semibold text-navy shadow-sm transition-colors hover:bg-surface-muted disabled:opacity-60"
        >
          <GoogleIcon />
          {fallbackPending ? "Redirigiendo..." : "Continuar con Google"}
        </button>
        {error && <p className="text-sm text-red-600">{error}</p>}
      </div>
    );
  }

  return (
    <div className={`flex flex-col gap-2 ${className}`}>
      <Script
        src="https://accounts.google.com/gsi/client"
        strategy="afterInteractive"
        onLoad={initializeGis}
        onError={() => {
          console.error("[GoogleSignInButton] Failed to load accounts.google.com/gsi/client");
          setUseFallback(true);
        }}
      />
      <div ref={containerRef} className="flex w-full justify-center [&>div]:w-full" />
      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  );
}
