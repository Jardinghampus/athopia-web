import { createHash } from "crypto";

export const FREE_DAILY_LIMIT = 20;

/** AGENTS.md: inloggad = clerk_user_id, anon = anon::{ip_hash}. */
export function getAnonFeedUserId(req: Request): string {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  const ipHash = createHash("sha256").update(ip).digest("hex").slice(0, 16);
  return `anon::${ipHash}`;
}

export function resolveFeedUserId(userId: string | null | undefined, req: Request): string {
  return userId ?? getAnonFeedUserId(req);
}
