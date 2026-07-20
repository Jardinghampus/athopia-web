/**
 * Explainable Home module ranking v1 (no ML).
 *
 * score =
 *   typeBase
 *   + freshnessBoost
 *   + engagementBoost (discussion)
 *   + editorialPriority (fixed slots preference)
 *
 * Positions are reassigned after sort so clients keep inserting at
 * tracking.position. Reasons stay human-readable for agent_logs.
 */
import type { FeedModule } from "@/lib/feed/build-feed-modules";

const TYPE_BASE: Record<string, number> = {
  // Live-adjacent / urgency first when we add live_match later
  live_match: 100,
  upcoming_matches: 80,
  discussion: 55,
  podcast: 45,
  standings_snapshot: 40,
  featured_article: 50,
  headline_stack: 48,
};

const SLOT_PREFERENCE = [4, 8, 12, 16, 20];

function hoursSince(iso: string | null | undefined): number | null {
  if (!iso) return null;
  const t = Date.parse(iso);
  if (!Number.isFinite(t)) return null;
  return Math.max(0, (Date.now() - t) / 3_600_000);
}

function freshnessBoost(hours: number | null): number {
  if (hours == null) return 0;
  if (hours <= 6) return 25;
  if (hours <= 24) return 15;
  if (hours <= 72) return 8;
  if (hours <= 168) return 3;
  return 0;
}

function discussionEngagement(payload: Record<string, unknown>): number {
  const likes = Number(payload.likeCount ?? 0) || 0;
  const replies = Number(payload.replyCount ?? 0) || 0;
  // Cap so one viral thread doesn't dominate forever
  return Math.min(30, likes * 0.5 + replies * 2);
}

export type RankedFeedModule = FeedModule & {
  tracking: FeedModule["tracking"] & {
    score: number;
    factors: string[];
  };
};

function scoreModule(mod: FeedModule): { score: number; factors: string[] } {
  const factors: string[] = [];
  let score = TYPE_BASE[mod.type] ?? 20;
  factors.push(`type:${mod.type}=${TYPE_BASE[mod.type] ?? 20}`);

  if (mod.type === "podcast") {
    const publishedAt =
      typeof mod.payload.publishedAt === "string"
        ? mod.payload.publishedAt
        : null;
    const h = hoursSince(publishedAt);
    const f = freshnessBoost(h);
    score += f;
    if (f > 0) factors.push(`freshness=${f}`);
  }

  if (mod.type === "discussion") {
    const createdAt =
      typeof mod.payload.createdAt === "string" ? mod.payload.createdAt : null;
    const h = hoursSince(createdAt);
    const f = freshnessBoost(h);
    const e = discussionEngagement(mod.payload);
    score += f + e;
    if (f > 0) factors.push(`freshness=${f}`);
    if (e > 0) factors.push(`engagement=${e}`);
  }

  if (mod.type === "standings_snapshot") {
    // Stable league pulse — slight boost midday matchdays left for later
    score += 5;
    factors.push("league_pulse=5");
  }

  return { score, factors };
}

/**
 * Rank modules and assign insert positions from SLOT_PREFERENCE.
 * Dedupes by id. Returns at most `limit` modules.
 */
export function rankFeedModules(
  modules: FeedModule[],
  limit = 5,
): RankedFeedModule[] {
  const seen = new Set<string>();
  const scored = modules
    .filter((m) => {
      if (seen.has(m.id)) return false;
      seen.add(m.id);
      return true;
    })
    .map((m) => {
      const { score, factors } = scoreModule(m);
      return { mod: m, score, factors };
    })
    .sort((a, b) => b.score - a.score || a.mod.id.localeCompare(b.mod.id))
    .slice(0, limit);

  return scored.map((row, i) => ({
    ...row.mod,
    tracking: {
      reason: row.mod.tracking.reason,
      position: SLOT_PREFERENCE[i] ?? 4 + i * 4,
      score: Math.round(row.score * 10) / 10,
      factors: row.factors,
    },
  }));
}
