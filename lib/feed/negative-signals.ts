/**
 * Slice 2 closed loop — negative feed signals (content_hidden / less_like_this).
 *
 * Only ever called when FEED_RANKER_V2 is on AND the user has opted into
 * personalization (user_feed_config.personalization_enabled). Fail-soft:
 * any DB error returns empty sets so the feed never breaks.
 *
 * Caching: unstable_cache keyed by userId, 60s TTL — feed_interactions writes
 * are best-effort UI feedback, not real-time-critical, so a short window
 * trades a little staleness for avoiding a DB round trip on every feed
 * request. Wrapped in React `cache()` for per-request dedup (buildFeedModules
 * and the events route can both read it in the same request without a
 * second query). unstable_cache can't hold Sets/Maps across a cold cache
 * (JSON-serialized), so the cached layer stores plain arrays and this module
 * rebuilds the Set/Map view on every call.
 */
import { cache } from "react";
import { unstable_cache } from "next/cache";
import type { SupabaseClient } from "@supabase/supabase-js";

const WINDOW_DAYS = 14;
const MAX_ROWS = 500;
const TTL_SECONDS = 60;
/** Calibrated so a handful of dislikes clearly move score, but can't zero out a module on their own. */
const LESS_LIKED_PENALTY_PER_EVENT = 6;
const LESS_LIKED_PENALTY_CAP = 30;

export type NegativeSignals = {
  hiddenItemIds: Set<string>;
  hiddenModuleKeys: Set<string>;
  lessLiked: Map<string, number>;
};

function emptySignals(): NegativeSignals {
  return {
    hiddenItemIds: new Set(),
    hiddenModuleKeys: new Set(),
    lessLiked: new Map(),
  };
}

type RawNegativeSignals = {
  hiddenItemIds: string[];
  hiddenModuleKeys: string[];
  lessLiked: [string, number][];
};

async function fetchNegativeSignals(
  userId: string,
  db: SupabaseClient,
): Promise<RawNegativeSignals> {
  const since = new Date(Date.now() - WINDOW_DAYS * 24 * 60 * 60 * 1000).toISOString();

  const { data, error } = await db
    .from("feed_interactions")
    .select("event_type, item_id, module_key")
    .eq("clerk_user_id", userId)
    .eq("sport", "football")
    .in("event_type", ["content_hidden", "less_like_this"])
    .gte("occurred_at", since)
    .order("occurred_at", { ascending: false })
    .limit(MAX_ROWS);

  if (error || !data) {
    return { hiddenItemIds: [], hiddenModuleKeys: [], lessLiked: [] };
  }

  const hiddenItemIds = new Set<string>();
  const hiddenModuleKeys = new Set<string>();
  const lessLikedCounts = new Map<string, number>();

  for (const row of data as { event_type: string; item_id: string | null; module_key: string | null }[]) {
    if (row.event_type === "content_hidden") {
      if (row.item_id) hiddenItemIds.add(row.item_id);
      if (row.module_key) hiddenModuleKeys.add(row.module_key);
    } else if (row.event_type === "less_like_this") {
      const key = row.module_key ?? row.item_id;
      if (key) lessLikedCounts.set(key, (lessLikedCounts.get(key) ?? 0) + 1);
    }
  }

  return {
    hiddenItemIds: [...hiddenItemIds],
    hiddenModuleKeys: [...hiddenModuleKeys],
    lessLiked: [...lessLikedCounts.entries()],
  };
}

/** Request-deduped + 60s-TTL cached fetch. Never throws. */
const getRawNegativeSignals = cache(
  async (userId: string, db: SupabaseClient): Promise<RawNegativeSignals> => {
    try {
      const cached = unstable_cache(
        () => fetchNegativeSignals(userId, db),
        ["feed-negative-signals", userId],
        { revalidate: TTL_SECONDS, tags: [`feed-negative-signals:${userId}`] },
      );
      return await cached();
    } catch (err) {
      console.warn("[feed] negative-signals fel:", err);
      return { hiddenItemIds: [], hiddenModuleKeys: [], lessLiked: [] };
    }
  },
);

/**
 * Fetch this user's recent content_hidden / less_like_this signals.
 * Caller must gate this behind FEED_RANKER_V2 + personalization_enabled —
 * this function does no gating itself, it only fetches + shapes.
 */
export async function getNegativeSignals(
  userId: string,
  db: SupabaseClient,
): Promise<NegativeSignals> {
  try {
    const raw = await getRawNegativeSignals(userId, db);
    return {
      hiddenItemIds: new Set(raw.hiddenItemIds),
      hiddenModuleKeys: new Set(raw.hiddenModuleKeys),
      lessLiked: new Map(raw.lessLiked),
    };
  } catch (err) {
    console.warn("[feed] negative-signals fel:", err);
    return emptySignals();
  }
}

export function lessLikedPenalty(count: number): number {
  return Math.min(LESS_LIKED_PENALTY_CAP, count * LESS_LIKED_PENALTY_PER_EVENT);
}
