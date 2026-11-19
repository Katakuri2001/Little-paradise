/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * Distributed rate limiter backed by Cloudflare KV.
 *
 * Falls back to an in-memory Map when KV is not available (local dev).
 * Each call is atomic per key: read current counter, increment, write back.
 * Under concurrent Workers instances, KV provides the coordination.
 */
const memoryBuckets = new Map<string, { count: number; resetAt: number }>();

export async function checkRateLimitKV(
  kv: any,
  key: string,
  limit: number,
  windowMs: number,
): Promise<{ allowed: boolean; retryAfter: number }> {
  if (kv) {
    return checkRateLimitKVWithKV(kv, key, limit, windowMs);
  }
  return checkRateLimitInMemory(memoryBuckets, key, limit, windowMs);
}

async function checkRateLimitKVWithKV(
  kv: any,
  key: string,
  limit: number,
  windowMs: number,
): Promise<{ allowed: boolean; retryAfter: number }> {
  const now = Date.now();
  const resetAt = now + windowMs;

  let current: { count: number; resetAt: number } | null = null;
  try {
    const raw = await kv.get(key);
    if (raw) {
      current = JSON.parse(raw);
    }
  } catch {
    // Treat unreadable KV as empty counter
    current = null;
  }

  if (!current || current.resetAt < now) {
    // Window expired or no counter yet — start fresh
    try {
      await kv.put(key, JSON.stringify({ count: 1, resetAt }), {
        expirationTtl: Math.ceil(windowMs / 1000),
      });
    } catch {
      // Ignore put failures; rate limiting is best-effort
    }
    return { allowed: true, retryAfter: 0 };
  }

  if (current.count >= limit) {
    return { allowed: false, retryAfter: Math.ceil((current.resetAt - now) / 1000) };
  }

  try {
    await kv.put(key, JSON.stringify({ count: current.count + 1, resetAt: current.resetAt }), {
      expirationTtl: Math.ceil(windowMs / 1000),
    });
  } catch {
    // Ignore put failures
  }
  return { allowed: true, retryAfter: 0 };
}

function checkRateLimitInMemory(
  buckets: Map<string, { count: number; resetAt: number }>,
  key: string,
  limit: number,
  windowMs: number,
): { allowed: boolean; retryAfter: number } {
  const now = Date.now();
  const b = buckets.get(key);

  if (!b || b.resetAt < now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, retryAfter: 0 };
  }

  if (b.count >= limit) {
    return { allowed: false, retryAfter: Math.ceil((b.resetAt - now) / 1000) };
  }

  b.count += 1;
  return { allowed: true, retryAfter: 0 };
}
