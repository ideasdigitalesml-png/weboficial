import type { NextConfig } from "next";

// Kept in one place because both the CSP and Permissions-Policy below need
// to reason about the exact same set of third-party origins this app talks
// to (Supabase, GA4, Meta Pixel) -- drifting between headers is how CSPs
// quietly break a feature in production.
const SUPABASE_ORIGIN = "https://pqkwpgojpkwcrufhfjpx.supabase.co";
const SUPABASE_WS_ORIGIN = "wss://pqkwpgojpkwcrufhfjpx.supabase.co";

// No nonces: the GA4/Meta Pixel snippets in layout.tsx are inline <Script>
// tags, and nonce-based CSP would force every page (including the public
// landing pages, which should stay staticly-optimizable) into dynamic
// rendering. 'unsafe-inline' is the documented fallback for that tradeoff --
// see node_modules/next/dist/docs/01-app/02-guides/content-security-policy.md.
// connect-src needs 'data:' (not just img-src) because uploadPendingPhotos
// does fetch(dataUrl).blob() to turn a captured photo into a Blob before
// uploading it -- fetch() to a data: URI is gated by connect-src, unlike an
// <img src="data:..."> which only needs img-src. Without it, every
// profile-photo upload throws "Failed to fetch" in the browser only (CSP
// isn't enforced in Node scripts/tests, which is how this went unnoticed).
const CSP = `
  default-src 'self';
  script-src 'self' 'unsafe-inline' https://www.googletagmanager.com https://connect.facebook.net;
  style-src 'self' 'unsafe-inline';
  img-src 'self' data: blob: ${SUPABASE_ORIGIN} https://www.facebook.com https://www.google-analytics.com;
  font-src 'self' data:;
  connect-src 'self' data: ${SUPABASE_ORIGIN} ${SUPABASE_WS_ORIGIN} https://www.google-analytics.com https://connect.facebook.net;
  object-src 'none';
  base-uri 'self';
  form-action 'self';
  frame-ancestors 'none';
  upgrade-insecure-requests;
`
  .replace(/\s{2,}/g, " ")
  .trim();

const nextConfig: NextConfig = {
  /* config options here */
  reactCompiler: true,
  // Next's dev server blocks cross-origin requests by default (HMR, RSC
  // payloads, etc.). Needed so the app works when browsed through the
  // ngrok tunnel used to test the Mercado Pago webhook, not just localhost.
  allowedDevOrigins: ["retiree-tactical-citrus.ngrok-free.dev"],

  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "Content-Security-Policy", value: CSP },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          {
            key: "Strict-Transport-Security",
            value: "max-age=31536000; includeSubDomains",
          },
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
          {
            key: "Permissions-Policy",
            value:
              "camera=(), microphone=(), geolocation=(), payment=(), usb=(), browsing-topics=()",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
