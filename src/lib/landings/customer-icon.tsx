import { ImageResponse } from "next/og";

// Shared by every customer-landing icon.tsx/apple-icon.tsx (both the
// /[slug] path-based route and the /site/[slug] subdomain/custom-domain
// rewrite target) -- deliberately NOT weboficial's own icon.svg mark, so a
// visitor's browser tab / iOS home-screen icon shows the professional's own
// initials instead of weboficial's branding. Neutral navy, no logo shape,
// so it never looks like a copy of weboficial's own icon.
export function renderCustomerIcon(initials: string, size: number) {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#0F1E3D",
          color: "#fff",
          fontFamily: "sans-serif",
          fontWeight: 700,
          fontSize: Math.round(size * 0.42),
        }}
      >
        {initials}
      </div>
    ),
    { width: size, height: size }
  );
}
