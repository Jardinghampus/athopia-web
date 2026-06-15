/**
 * In-memory rate limiter per IP-adress.
 * Tillräckligt för MVP på Vercel (stateless per instans).
 * Byt till Upstash Redis vid behov av cross-instans enforcement.
 */

interface Entry {
  count: number;
  resetAt: number;
}

const store = new Map<string, Entry>();

interface RateLimitOptions {
  /** Max antal requests per fönster */
  limit: number;
  /** Fönster i millisekunder */
  windowMs: number;
}

interface RateLimitResult {
  success: boolean;
  /** Kvarvarande requests i aktuellt fönster */
  remaining: number;
  /** Unix-timestamp (ms) när fönstret nollställs */
  resetAt: number;
}

export function rateLimit(key: string, opts: RateLimitOptions): RateLimitResult {
  const now = Date.now();
  const entry = store.get(key);

  if (!entry || entry.resetAt < now) {
    const newEntry: Entry = { count: 1, resetAt: now + opts.windowMs };
    store.set(key, newEntry);
    // Rensa gamla nycklar var 1000:e request för att undvika minneläcka
    if (store.size > 10_000) {
      for (const [k, v] of store) {
        if (v.resetAt < now) store.delete(k);
      }
    }
    return { success: true, remaining: opts.limit - 1, resetAt: newEntry.resetAt };
  }

  entry.count += 1;
  const success = entry.count <= opts.limit;
  return { success, remaining: Math.max(0, opts.limit - entry.count), resetAt: entry.resetAt };
}

/** Hämtar klientens IP från Next.js request-headers. */
export function getClientIp(req: Request): string {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    req.headers.get("x-real-ip") ??
    "unknown"
  );
}
