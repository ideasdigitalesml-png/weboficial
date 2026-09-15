// Behind a reverse proxy (ngrok in dev, Vercel in production), the request
// Next sees internally reflects the proxy's own host, not the public one
// the browser is actually on. x-forwarded-host/-proto carry the real
// external origin in both cases, so prefer them when present.
export function resolveOrigin(request: Request, fallbackOrigin: string): string {
  const forwardedHost = request.headers.get("x-forwarded-host");
  if (!forwardedHost) return fallbackOrigin;

  const forwardedProto = request.headers.get("x-forwarded-proto") ?? "https";
  return `${forwardedProto}://${forwardedHost}`;
}
