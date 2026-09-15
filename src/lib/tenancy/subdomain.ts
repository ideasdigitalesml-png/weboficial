// Hosts that must never be treated as a professional's tenant subdomain,
// on any root domain (production or the lvh.me dev alias).
export const RESERVED_HOSTS = new Set([
  "www",
  "app",
  "admin",
  "api",
  "localhost",
]);

// Pure host-parsing logic, kept separate from proxy.ts so it can be unit
// tested without spinning up a server or an Edge runtime.
//
// Supports two shapes:
//   - production: "<slug>.<rootDomain>" (e.g. juanperez.plataforma.com.ar)
//   - local dev:  "<slug>.lvh.me" (lvh.me publicly resolves to 127.0.0.1,
//     so it behaves like a real subdomain in the browser without any
//     /etc/hosts editing or DNS setup)
//
// Returns null when the host is the bare root domain, a reserved host
// (www, app, admin, api, localhost), or anything else that isn't a tenant.
export function extractSubdomain(
  host: string,
  rootDomain: string
): string | null {
  const hostname = host.split(":")[0].toLowerCase();
  const root = rootDomain.split(":")[0].toLowerCase();

  if (hostname === root || hostname === "localhost" || hostname === "127.0.0.1") {
    return null;
  }

  let label: string | null = null;

  if (hostname.endsWith(`.${root}`)) {
    label = hostname.slice(0, hostname.length - root.length - 1).split(".")[0];
  } else if (hostname === "lvh.me" || hostname.endsWith(".lvh.me")) {
    const parts = hostname.split(".");
    label = parts.length > 2 ? parts[0] : null;
  } else {
    return null;
  }

  if (!label || RESERVED_HOSTS.has(label)) {
    return null;
  }

  return label;
}
