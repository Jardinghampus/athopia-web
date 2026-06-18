/**
 * lib/ratelimit.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Distribuerad rate limiting via Upstash Redis (sliding window).
 *
 * VARFÖR Upstash och inte in-memory:
 *   Vid 100K användare kör webben på flera Vercel-instanser samtidigt. En
 *   in-memory-räknare är per-instans → en angripare som träffar olika instanser
 *   kringgår gränsen helt. Upstash är en delad räknare över alla instanser.
 *
 * Graceful degradation:
 *   Om UPSTASH_REDIS_REST_URL/TOKEN saknas (lokalt, preview utan env) blir
 *   rate limiting en no-op som ALLTID släpper igenom. Sajten kraschar aldrig
 *   pga saknad rate-limit-infra — men i produktion MÅSTE env sättas.
 *
 * Lazy init (kodregel): klienten skapas i function body, aldrig module-level.
 *
 * Env (Vercel + .env.local):
 *   UPSTASH_REDIS_REST_URL
 *   UPSTASH_REDIS_REST_TOKEN
 * ─────────────────────────────────────────────────────────────────────────────
 */
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

export function isRateLimitConfigured(): boolean {
  return (
    !!process.env.UPSTASH_REDIS_REST_URL &&
    !!process.env.UPSTASH_REDIS_REST_TOKEN
  );
}

// Cache:a Ratelimit-instanser per "bucket" så vi inte återskapar dem per request.
const limiters = new Map<string, Ratelimit>();

/**
 * Fördefinierade gränser. Justera per endpoint-känslighet.
 * Format: [antal, fönster]. Sliding window jämnar ut bursts.
 */
export const LIMITS = {
  // Skrivningar från inloggade users (forum, predictions, profil)
  write: { tokens: 20, window: "1 m" as const },
  // Dyra/missbruksbara endpoints (sök, AI-relaterat)
  search: { tokens: 10, window: "1 m" as const },
  // Checkout/betalning — lågt, skyddar mot abuse
  checkout: { tokens: 5, window: "1 m" as const },
  // Generöst default för läsning/övrigt
  read: { tokens: 60, window: "1 m" as const },
} satisfies Record<string, { tokens: number; window: `${number} ${"s" | "m" | "h"}` }>;

export type LimitName = keyof typeof LIMITS;

function getLimiter(name: LimitName): Ratelimit | null {
  if (!isRateLimitConfigured()) return null;
  const cached = limiters.get(name);
  if (cached) return cached;

  const { tokens, window } = LIMITS[name];
  const limiter = new Ratelimit({
    redis: Redis.fromEnv(),
    limiter: Ratelimit.slidingWindow(tokens, window),
    prefix: `athopia:rl:${name}`,
    analytics: false,
  });
  limiters.set(name, limiter);
  return limiter;
}

export interface RateLimitResult {
  success: boolean;
  limit: number;
  remaining: number;
  /** Sekunder till nästa tillåtna anrop (för Retry-After). */
  retryAfterSeconds: number;
}

/**
 * Kontrollera och konsumera en token för (limitName, identifier).
 * identifier = clerk userId om inloggad, annars en IP-hash (se identifierFrom).
 *
 * No-op (success:true) om Upstash ej konfigurerat.
 */
export async function rateLimit(
  name: LimitName,
  identifier: string
): Promise<RateLimitResult> {
  const limiter = getLimiter(name);
  const limit = LIMITS[name].tokens;

  if (!limiter) {
    return { success: true, limit, remaining: limit, retryAfterSeconds: 0 };
  }

  try {
    const res = await limiter.limit(identifier);
    const retryAfterSeconds = res.success
      ? 0
      : Math.max(1, Math.ceil((res.reset - Date.now()) / 1000));
    return {
      success: res.success,
      limit: res.limit,
      remaining: res.remaining,
      retryAfterSeconds,
    };
  } catch (err) {
    // Fail-open: om Redis tillfälligt nere ska sajten inte sluta fungera.
    console.error("[ratelimit] Upstash-fel, släpper igenom:", err);
    return { success: true, limit, remaining: limit, retryAfterSeconds: 0 };
  }
}

/**
 * Härled en stabil identifierare från request:
 *   - inloggad: "user:<clerkUserId>"
 *   - anonym:   "ip:<ip>"  (Vercel sätter x-forwarded-for)
 */
export function identifierFrom(req: Request, userId?: string | null): string {
  if (userId) return `user:${userId}`;
  const fwd = req.headers.get("x-forwarded-for") ?? "";
  const ip = fwd.split(",")[0]?.trim() || req.headers.get("x-real-ip") || "unknown";
  return `ip:${ip}`;
}

/**
 * Bekvämlighets-helper: returnerar ett färdigt 429-svar med Retry-After,
 * eller null om anropet är tillåtet.
 *
 *   const blocked = await enforceRateLimit("write", req, userId);
 *   if (blocked) return blocked;
 */
export async function enforceRateLimit(
  name: LimitName,
  req: Request,
  userId?: string | null
): Promise<Response | null> {
  const id = identifierFrom(req, userId);
  const result = await rateLimit(name, id);
  if (result.success) return null;

  return new Response(
    JSON.stringify({
      message: "För många förfrågningar. Försök igen om en stund.",
      retryAfterSeconds: result.retryAfterSeconds,
    }),
    {
      status: 429,
      headers: {
        "content-type": "application/json",
        "retry-after": String(result.retryAfterSeconds),
        "x-ratelimit-limit": String(result.limit),
        "x-ratelimit-remaining": String(result.remaining),
      },
    }
  );
}
