import { createHmac, timingSafeEqual } from "node:crypto";

interface ParsedSignature {
  ts: string;
  v1: string;
}

function parseXSignature(header: string): ParsedSignature | null {
  const parts: Record<string, string> = {};
  for (const segment of header.split(",")) {
    const [key, value] = segment.split("=");
    if (key && value) parts[key.trim()] = value.trim();
  }
  if (!parts.ts || !parts.v1) return null;
  return { ts: parts.ts, v1: parts.v1 };
}

// Per Mercado Pago's documented signature scheme: HMAC-SHA256 over
// "id:{data.id};request-id:{x-request-id};ts:{ts};" using the app's
// webhook secret (a value separate from MP_ACCESS_TOKEN, generated in the
// Webhooks section of the developer panel).
export function buildManifest(dataId: string, requestId: string, ts: string): string {
  return `id:${dataId.toLowerCase()};request-id:${requestId};ts:${ts};`;
}

export function verifyMercadoPagoSignature({
  xSignature,
  xRequestId,
  dataId,
  secret,
}: {
  xSignature: string | null;
  xRequestId: string | null;
  dataId: string | null;
  secret: string;
}): boolean {
  if (!xSignature || !xRequestId || !dataId) return false;

  const parsed = parseXSignature(xSignature);
  if (!parsed) return false;

  const manifest = buildManifest(dataId, xRequestId, parsed.ts);
  const expected = createHmac("sha256", secret).update(manifest).digest("hex");

  const expectedBuffer = Buffer.from(expected, "hex");
  const providedBuffer = Buffer.from(parsed.v1, "hex");

  if (expectedBuffer.length !== providedBuffer.length) return false;
  return timingSafeEqual(expectedBuffer, providedBuffer);
}
