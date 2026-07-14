import "server-only";

import { Redis } from "@upstash/redis";
import { isRateLimitConfigured } from "@/lib/ratelimit";

const LOCK_TTL_SECONDS = 10;
const MAX_ATTEMPTS = 12;

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Serializes plan metadata writes per user to avoid lost updates when Stripe
 * and StoreKit webhooks land at the same time.
 */
export async function withUserPlanLock<T>(
  userId: string,
  fn: () => Promise<T>,
): Promise<T> {
  if (!isRateLimitConfigured()) return fn();

  const redis = Redis.fromEnv();
  const key = `athopia:plan-lock:${userId}`;

  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
    const acquired = await redis.set(key, "1", { nx: true, ex: LOCK_TTL_SECONDS });
    if (acquired) {
      try {
        return await fn();
      } finally {
        await redis.del(key);
      }
    }
    await sleep(50 * (attempt + 1));
  }

  console.warn(`[plan-lock] timeout for ${userId}, proceeding without lock`);
  return fn();
}
