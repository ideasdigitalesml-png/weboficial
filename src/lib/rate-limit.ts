// In-memory fixed-window rate limiter. Per-instance only -- Fluid Compute
// reuses instances across requests so this catches sustained abuse from a
// single user in practice, but it isn't a hard cap shared across
// concurrently-running instances. That's an acceptable tradeoff here: the
// goal is protecting a limited external quota (the Fixie proxy's request
// allowance for ResellerClub calls) from a single misbehaving user/script,
// not perfect global enforcement.
const buckets = new Map<string, { count: number; resetAt: number }>();

// Opportunistic cleanup so `buckets` doesn't grow unbounded over the life
// of an instance -- runs at most once per call, only when the map has
// grown large enough to matter.
function sweepExpired(now: number) {
  if (buckets.size < 1000) return;
  for (const [key, bucket] of buckets) {
    if (now >= bucket.resetAt) buckets.delete(key);
  }
}

export function checkRateLimit(key: string, limit: number, windowMs: number): boolean {
  const now = Date.now();
  sweepExpired(now);

  const bucket = buckets.get(key);
  if (!bucket || now >= bucket.resetAt) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return true;
  }
  if (bucket.count >= limit) return false;
  bucket.count += 1;
  return true;
}
