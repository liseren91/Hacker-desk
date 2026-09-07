import { RATE_LIMIT_WINDOW_MS } from "@/lib/constants";

/**
 * In-memory throttle. The board is deliberately a single instance (SQLite is
 * not shared across replicas), so a process-local map is enough — it just
 * resets on redeploy, which is acceptable for spam control.
 */
const lastPostAt = new Map<string, number>();

/** Drop stale entries so a long-running process does not grow unbounded. */
function evictExpired(now: number): void {
  for (const [ip, timestamp] of lastPostAt) {
    if (now - timestamp > RATE_LIMIT_WINDOW_MS) {
      lastPostAt.delete(ip);
    }
  }
}

export type RateLimitVerdict =
  | { allowed: true }
  | { allowed: false; retryAfterMs: number };

export function checkRateLimit(ip: string): RateLimitVerdict {
  const now = Date.now();
  const previous = lastPostAt.get(ip);

  if (previous !== undefined && now - previous < RATE_LIMIT_WINDOW_MS) {
    return { allowed: false, retryAfterMs: RATE_LIMIT_WINDOW_MS - (now - previous) };
  }

  if (lastPostAt.size > 1000) {
    evictExpired(now);
  }
  lastPostAt.set(ip, now);
  return { allowed: true };
}

/**
 * Best-effort client address. Railway terminates TLS at its edge, so the real
 * address arrives in x-forwarded-for.
 */
export function clientIpFrom(headers: Headers): string {
  const forwarded = headers.get("x-forwarded-for");
  if (forwarded) {
    const first = forwarded.split(",")[0]?.trim();
    if (first) return first;
  }
  return headers.get("x-real-ip")?.trim() || "unknown";
}
