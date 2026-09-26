import type { CSSProperties } from "react";

function isRealUrl(value?: string): value is string {
  return Boolean(value && value !== "#");
}

// Professionals type these into a plain text field (see the linkedin_url/
// instagram_url form_schema entries) with no enforced protocol -- an href
// like "instagram.com/usuario" is a relative path to Next's router, not an
// external link, and resolves to https://weboficial.com.ar/instagram.com/usuario.
function normalizeUrl(url: string): string {
  return /^https?:\/\//i.test(url) ? url : `https://${url}`;
}

// Shared clickable LinkedIn/Instagram icon pair for every premium template's
// contact/footer area. Renders nothing at all if neither URL is set (never
// an empty wrapper) -- each template still supplies its own `className` for
// spacing/color via its own <style> block, this only owns the SVG markup so
// it isn't duplicated across nine near-identical copies.
export function SocialLinks({
  linkedinUrl,
  instagramUrl,
  size = 20,
  className,
  style,
}: {
  linkedinUrl?: string;
  instagramUrl?: string;
  size?: number;
  className?: string;
  style?: CSSProperties;
}) {
  const hasLinkedin = isRealUrl(linkedinUrl);
  const hasInstagram = isRealUrl(instagramUrl);
  if (!hasLinkedin && !hasInstagram) return null;

  return (
    <span
      className={className}
      style={{ display: "inline-flex", alignItems: "center", gap: "10px", ...style }}
    >
      {hasLinkedin && (
        <a href={normalizeUrl(linkedinUrl)} target="_blank" rel="noopener noreferrer" aria-label="LinkedIn" style={{ display: "inline-flex", color: "inherit" }}>
          <svg viewBox="0 0 24 24" width={size} height={size} fill="currentColor" aria-hidden="true">
            <path d="M20.45 20.45h-3.56v-5.57c0-1.33-.02-3.04-1.85-3.04-1.86 0-2.15 1.45-2.15 2.94v5.67H9.33V9h3.41v1.56h.05c.48-.9 1.64-1.85 3.38-1.85 3.6 0 4.27 2.37 4.27 5.46v6.28ZM5.34 7.43a2.07 2.07 0 1 1 0-4.13 2.07 2.07 0 0 1 0 4.13ZM7.12 20.45H3.56V9h3.56v11.45Z" />
          </svg>
        </a>
      )}
      {hasInstagram && (
        <a href={normalizeUrl(instagramUrl)} target="_blank" rel="noopener noreferrer" aria-label="Instagram" style={{ display: "inline-flex", color: "inherit" }}>
          <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
            <rect x="3" y="3" width="18" height="18" rx="5" />
            <circle cx="12" cy="12" r="4" />
            <circle cx="17.3" cy="6.7" r="1.1" fill="currentColor" stroke="none" />
          </svg>
        </a>
      )}
    </span>
  );
}
