import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  reactCompiler: true,
  // Next's dev server blocks cross-origin requests by default (HMR, RSC
  // payloads, etc.). Needed so the app works when browsed through the
  // ngrok tunnel used to test the Mercado Pago webhook, not just localhost.
  allowedDevOrigins: ["retiree-tactical-citrus.ngrok-free.dev"],
};

export default nextConfig;
