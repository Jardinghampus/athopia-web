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
  live_match: 100,
  upcoming_matches: 80,
  discussion: 55,
  audio_briefing: 52,
  short_post: 50,
  featured_article: 50,
  headline_stack: 48,
  podcast: 45,
  standings_snapshot: 40,
};

const SLOT_PREFERENCE = [2, 4, 8, 12, 16];

/** Slice 2 personalization context — optional, only used when the flag is on. */
export type RankFeedModulesContext = {
  followedTeamIds?: string[];
  interests?: string[];
};

/** Feature flag: OFF by default so prod behavior is byte-for-byte unchanged. */
export function isFeedRankerV2Enabled(): boolean {
  return process.env.FEED_RANKER_V2 === "true";
}

const TEAM_AFFINITY_BOOST = 12;
const INTEREST_AFFINITY_BOOST = 8;
// ponytail: fatigue penalty is a flat per-repeat cost, not a decaying curve —
// good enough to stop one type monopolizing the slice without new state.
const TYPE_FATIGUE_PENALTY = 10;

/** Best-effort team slugs/ids referenced by a module's payload (shape varies by type). */
function moduleTeamRefs(payload: Record<string, unknown>): string[] {
  const refs: string[] = [];
  const pushIf = (v: unknown) => {
    if (typeof v === "string" && v) refs.push(v);
  };
  pushIf(payload.homeSlug);
  pushIf(payload.awaySlug);
  pushIf(payload.teamSlug);
  const rows = Array.isArray(payload.rows) ? payload.rows : [];
  for (const r of rows as Record<string, unknown>[]) pushIf(r.teamSlug);
  const matches = Array.isArray(payload.matches) ? payload.matches : [];
  for (const m of matches as Record<string, unknown>[]) {
    pushIf(m.homeSlug);
    pushIf(m.awaySlug);
  }
  return refs;
}

function personalizationTerms(
  mod: FeedModule,
  ctx: RankFeedModulesContext,
): { score: number; factors: string[] } {
  let score = 0;
  const factors: string[] = [];

  if (ctx.followedTeamIds?.length) {
    const refs = moduleTeamRefs(mod.payload);
    if (refs.some((r) => ctx.followedTeamIds!.includes(r))) {
      score += TEAM_AFFINITY_BOOST;
      factors.push(`team_affinity=+${TEAM_AFFINITY_BOOST}`);
    }
  }

  // ponytail: compares raw content_types interests directly against payload
  // newsTag (both are strings like "transfer"/"match"); "analysis" maps to
  // news_tag "news" upstream in content-preferences.ts and won't match here —
  // acceptable miss for v2's first cut, not a correctness bug.
  if (ctx.interests?.length) {
    const newsTag =
      typeof mod.payload.newsTag === "string" ? mod.payload.newsTag : null;
    if (newsTag && ctx.interests.includes(newsTag)) {
      score += INTEREST_AFFINITY_BOOST;
      factors.push(`interest_affinity=+${INTEREST_AFFINITY_BOOST}`);
    }
  }

  return { score, factors };
}

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

  if (mod.type === "podcast" || mod.type === "short_post") {
    const publishedAt =
      typeof mod.payload.publishedAt === "string"
        ? mod.payload.publishedAt
        : null;
    const h = hoursSince(publishedAt);
    const f = freshnessBoost(h);
    score += f;
    if (f > 0) factors.push(`freshness=${f}`);
  }

  if (mod.type === "audio_briefing") {
    const episodeDate =
      typeof mod.payload.episodeDate === "string"
        ? mod.payload.episodeDate
        : null;
    const h = hoursSince(episodeDate);
    const f = freshnessBoost(h);
    score += f;
    if (f > 0) factors.push(`freshness=${f}`);
  }

  if (mod.type === "headline_stack") {
    score += 8;
    factors.push("signal_stack=8");
  }

  if (mod.type === "upcoming_matches") {
    const matches = Array.isArray(mod.payload.matches)
      ? (mod.payload.matches as Record<string, unknown>[])
      : [];
    const soonest = matches
      .map((m) =>
        typeof m.startingAt === "string" ? hoursSince(m.startingAt) : null,
      )
      .filter((h): h is number => h != null)
      .sort((a, b) => a - b)[0];
    if (soonest != null) {
      let prox = 0;
      // Cap so upcoming never outranks live_match (100).
      if (soonest <= 6) prox = 15;
      else if (soonest <= 24) prox = 12;
      else if (soonest <= 72) prox = 8;
      else if (soonest <= 168) prox = 3;
      score += prox;
      if (prox > 0) factors.push(`kickoff_proximity=${prox}`);
    }
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
  ctx?: RankFeedModulesContext,
): RankedFeedModule[] {
  const personalize = isFeedRankerV2Enabled() && !!ctx;
  const seen = new Set<string>();
  const typeCounts = new Map<string, number>();
  const scored = modules
    .filter((m) => {
      if (seen.has(m.id)) return false;
      seen.add(m.id);
      return true;
    })
    .map((m) => {
      const { score, factors } = scoreModule(m);
      let total = score;
      const allFactors = factors;
      if (personalize) {
        const p = personalizationTerms(m, ctx!);
        total += p.score;
        allFactors.push(...p.factors);

        const seenOfType = typeCounts.get(m.type) ?? 0;
        typeCounts.set(m.type, seenOfType + 1);
        if (seenOfType > 0) {
          const penalty = TYPE_FATIGUE_PENALTY * seenOfType;
          total -= penalty;
          allFactors.push(`type_fatigue=-${penalty}`);
        }
      }
      return { mod: m, score: total, factors: allFactors };
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
