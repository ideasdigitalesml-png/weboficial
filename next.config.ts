import type { NextConfig } from "next";

// Kept in one place because both the CSP and Permissions-Policy below need
// to reason about the exact same set of third-party origins this app talks
// to (Supabase, GA4, Meta Pixel) -- drifting between headers is how CSPs
// quietly break a feature in production.
const SUPABASE_ORIGIN = "https://pqkwpgojpkwcrufhfjpx.supabase.co";
const SUPABASE_WS_ORIGIN = "wss://pqkwpgojpkwcrufhfjpx.supabase.co";

// The Card Payment Brick (dashboard checkout) loads sdk.mercadopago.com,
// which in turn pulls its own chunks/styles/card-brand icons and opens a
// cross-origin iframe for the card number/CVV fields (PCI SAQ A pattern --
// keeps raw card data off our page's JS), plus device-fingerprint calls to
// the mercadolibre.com/meli.com family. Wildcarded rather than pinned to
// exact subdomains because MP doesn't document a fixed list and we already
// got burned once by an under-scoped CSP (see connect-src 'data:' above).
const MP_ORIGINS = "https://*.mercadopago.com https://*.mercadolibre.com https://*.mlstatic.com https://*.meli.com";

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
// React's dev mode (Fast Refresh, component-stack reconstruction) needs
// eval(), which this CSP otherwise blocks -- normally harmless (it only
// shows up as a console warning), but scripts/generate-component-previews.js
// screenshots real pages served by a real `next dev`, and Next's dev
// overlay surfaces that warning as a visible "1 Issue" badge baked into the
// thumbnail. Loosened only when that script sets HIDE_DEV_INDICATOR --
// gated on NODE_ENV !== "production" too, belt-and-suspenders, so a stray
// env var could never relax script-src on an actual deployment.
const DEV_SCRIPT_SRC =
  process.env.HIDE_DEV_INDICATOR && process.env.NODE_ENV !== "production"
    ? " 'unsafe-eval'"
    : "";

const CSP = `
  default-src 'self';
  script-src 'self' 'unsafe-inline'${DEV_SCRIPT_SRC} https://www.googletagmanager.com https://connect.facebook.net ${MP_ORIGINS};
  style-src 'self' 'unsafe-inline' ${MP_ORIGINS};
  img-src 'self' data: blob: ${SUPABASE_ORIGIN} https://www.facebook.com https://www.google-analytics.com ${MP_ORIGINS};
  font-src 'self' data: ${MP_ORIGINS};
  connect-src 'self' data: ${SUPABASE_ORIGIN} ${SUPABASE_WS_ORIGIN} https://www.google-analytics.com https://connect.facebook.net ${MP_ORIGINS};
  frame-src ${MP_ORIGINS};
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
  // Drops the `X-Powered-By: Next.js` response header -- minor info
  // disclosure (names the exact framework to anyone probing the site),
  // flagged during a security-header audit alongside CSP/HSTS/etc, all of
  // which were already correctly set below.
  poweredByHeader: false,
  // Only set by scripts/generate-component-previews.js's spawned `next dev`
  // -- hides the dev-mode route indicator badge so it doesn't show up in
  // the screenshotted template thumbnails. Never set otherwise, so this has
  // no effect on normal `npm run dev`.
  ...(process.env.HIDE_DEV_INDICATOR ? { devIndicators: false } : {}),
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
