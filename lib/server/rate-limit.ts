/* eslint-disable @typescript-eslint/no-explicit-any */
import { checkRateLimitKV } from "./kv-rate-limit";

type Bucket = { count: number; resetAt: number };

const buckets = new Map<string, Bucket>();

export function checkRateLimit(
  key: string,
  limit: number,
  windowMs: number,
  kv?: any,
): Promise<{ allowed: boolean; retryAfter: number }> {
  if (kv) {
    return checkRateLimitKV(kv, key, limit, windowMs);
  }
  const now = Date.now();
  const b = buckets.get(key);
  if (!b || b.resetAt < now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return Promise.resolve({ allowed: true, retryAfter: 0 });
  }
  if (b.count >= limit) {
    return Promise.resolve({ allowed: false, retryAfter: Math.ceil((b.resetAt - now) / 1000) });
  }
  b.count += 1;
  return Promise.resolve({ allowed: true, retryAfter: 0 });
}

export function rateLimitKey(prefix: string, id: string) {
  return `${prefix}:${id}`;
}
