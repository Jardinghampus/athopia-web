import { timingSafeEqual } from "node:crypto";

/**
 * Constant-time string compare for shared secrets (cron, service tokens).
 * Returns false if either side is missing/empty or lengths differ.
 */
export function secretsEqual(
  provided: string | null | undefined,
  expected: string | null | undefined,
): boolean {
  if (!provided || !expected) return false;
  const a = Buffer.from(provided, "utf8");
  const b = Buffer.from(expected, "utf8");
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}
