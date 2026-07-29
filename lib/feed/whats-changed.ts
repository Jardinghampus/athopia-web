/**
 * Slice 3 P0 — "Vad har ändrats?" (what's new since the user's previous visit).
 *
 * No ML. Reuses `feed_interactions.feed_open` events (already emitted by the
 * client, see `lib/feed/feed-event-client.ts` + `app/api/feed/events/route.ts`)
 * to derive "last visit", then counts/collects `news_feed_clustered` rows
 * published after that timestamp, scoped to the user's followed teams when set.
 */
import { articlePublicPath } from "@/lib/provenance";

/** Feature flag: OFF by default so prod behavior is byte-for-byte unchanged. */
export function isWhatsChangedEnabled(): boolean {
  return process.env.WHATS_CHANGED === "true";
}

export type WhatsChangedItem = {
  id: string;
  title: string;
  href: string;
  publishedAt: string;
};

export type WhatsChangedSummary =
  | { firstVisit: true; since: null; newCount: 0; topItems: [] }
  | {
      firstVisit: false;
      since: string;
      newCount: number;
      topItems: WhatsChangedItem[];
    };

/**
 * Injectable data access so the pure logic is unit-testable without a DB.
 * `getRecentFeedOpens` must return occurred_at timestamps for the user's
 * `feed_open` events, newest first (2 is enough, but implementations may
 * return more).
 */
export type WhatsChangedDataAccessor = {
  getRecentFeedOpens: (userId: string) => Promise<string[]>;
  getItemsSince: (
    since: string,
    followedTeamIds: string[],
  ) => Promise<WhatsChangedItem[]>;
};

/** Real Supabase-backed accessor — `db` is `createServiceClient()` from `lib/supabase.ts`. */
export function createSupabaseWhatsChangedAccessor(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  db: any,
): WhatsChangedDataAccessor {
  return {
    async getRecentFeedOpens(userId: string) {
      const { data, error } = await db
        .from("feed_interactions")
        .select("occurred_at")
        .eq("clerk_user_id", userId)
        .eq("event_type", "feed_open")
        .order("occurred_at", { ascending: false })
        .limit(2);
      if (error || !data) return [];
      return (data as { occurred_at: string }[]).map((r) => r.occurred_at);
    },
    async getItemsSince(since: string, followedTeamIds: string[]) {
      let q = db
        .from("news_feed_clustered")
        .select(
          "id, title, url, slug, published_at, importance_score, rights_status, is_athopia_generated",
        )
        .eq("sport", "football")
        .gt("published_at", since)
        .order("importance_score", { ascending: false, nullsFirst: false })
        .limit(50);
      if (followedTeamIds.length === 1) {
        q = q.contains("entity_ids", [followedTeamIds[0]]);
      } else if (followedTeamIds.length > 1) {
        q = q.overlaps("entity_ids", followedTeamIds);
      }
      const { data, error } = await q;
      if (error || !data) return [];
      return (
        data as {
          id: string;
          title: string;
          url: string | null;
          slug: string | null;
          published_at: string;
          rights_status: string | null;
          is_athopia_generated: boolean | null;
        }[]
      ).map((row) => ({
        id: row.id,
        title: row.title,
        href: articlePublicPath({
          slug: row.slug,
          rights_status: row.rights_status,
          is_athopia_generated: row.is_athopia_generated,
          url: row.url,
        }),
        publishedAt: row.published_at,
      }));
    },
  };
}

const TOP_ITEMS_LIMIT = 3;

export async function getWhatsChanged(
  userId: string,
  opts: { followedTeamIds?: string[] },
  accessor: WhatsChangedDataAccessor,
): Promise<WhatsChangedSummary> {
  const feedOpens = await accessor.getRecentFeedOpens(userId);

  // Fewer than 2 feed_open events = no confirmed *previous* visit yet.
  if (feedOpens.length < 2) {
    return { firstVisit: true, since: null, newCount: 0, topItems: [] };
  }

  // Most recent feed_open is (most likely) the current session opening the
  // feed; the 2nd-most-recent is the previous visit's boundary.
  const since = feedOpens[1];
  const items = await accessor.getItemsSince(since, opts.followedTeamIds ?? []);

  return {
    firstVisit: false,
    since,
    newCount: items.length,
    topItems: items.slice(0, TOP_ITEMS_LIMIT),
  };
}
