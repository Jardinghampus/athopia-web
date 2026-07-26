/**
 * Slice 3 P1 — "Personlig Daily": a compact, time-boxed personal reading
 * brief ("3–7 min för mitt lag, mina ämnen och min tillgängliga tid").
 *
 * TEXT only (audio briefs are os-side, out of scope here). Composes existing
 * feed/team/match data — no new tables, no writes.
 *
 * Behind `PERSONLIG_DAILY` flag, OFF by default — see isPersonligDailyEnabled().
 */
import { createServerClient, isSupabaseConfigured } from "@/lib/supabase";
import { articlePublicPath } from "@/lib/provenance";
import { getFavoriteTeamMatchToday } from "@/lib/matchday/getFavoriteTeamMatchToday";

export type PersonalDailyItem = {
  id: string;
  title: string;
  href: string;
  sourceName: string | null;
  publishedAt: string;
};

export type PersonalDailySection = {
  key: "mitt-lag" | "dagens-match" | "allsvenskan" | "vart-att-veta";
  title: string;
  items: PersonalDailyItem[];
};

export type PersonalDaily = {
  minutes: number;
  generatedAt: string;
  sections: PersonalDailySection[];
  isEmpty: boolean;
};

/**
 * minutes -> itemBudget mapping (per section cap). 3 min ≈ 4 items,
 * 5 min ≈ 7 items, 7 min ≈ 10 items — a rough reading-speed heuristic,
 * not a science. Tunable in one place.
 */
export const MINUTES_TO_ITEM_BUDGET: Record<number, number> = {
  3: 4,
  5: 7,
  7: 10,
};
const DEFAULT_MINUTES = 5;

export function getItemBudget(minutes: number): number {
  return MINUTES_TO_ITEM_BUDGET[minutes] ?? MINUTES_TO_ITEM_BUDGET[DEFAULT_MINUTES];
}

export type PersonalDailyInputs = {
  /** News for the user's followed team(s), newest/most important first. */
  followedTeamNews: PersonalDailyItem[];
  /** Today's match for the primary favorite team, pre-shaped as a single item (or null if none). */
  todayMatch: PersonalDailyItem | null;
  /** League items that touch a followed team but aren't already team-specific news. */
  leagueItems: PersonalDailyItem[];
  /** Remaining top-importance items, used as the catch-all "worth knowing" section. */
  topImportance: PersonalDailyItem[];
};

/**
 * Pure composer: no I/O. Orders sections by priority, dedupes items across
 * sections (an item appearing earlier is never repeated later), and caps
 * each section at the minutes-derived item budget. Never fabricates —
 * empty sections are omitted entirely.
 */
export function buildPersonalDaily(
  inputs: PersonalDailyInputs,
  minutes: number,
): PersonalDaily {
  const itemBudget = getItemBudget(minutes);
  const seen = new Set<string>();

  function dedupeAndCap(items: PersonalDailyItem[]): PersonalDailyItem[] {
    const out: PersonalDailyItem[] = [];
    for (const item of items) {
      if (seen.has(item.id)) continue;
      seen.add(item.id);
      out.push(item);
      if (out.length >= itemBudget) break;
    }
    return out;
  }

  const sections: PersonalDailySection[] = [];

  const teamItems = dedupeAndCap(inputs.followedTeamNews);
  if (teamItems.length > 0) {
    sections.push({ key: "mitt-lag", title: "Ditt lag", items: teamItems });
  }

  if (inputs.todayMatch && !seen.has(inputs.todayMatch.id)) {
    seen.add(inputs.todayMatch.id);
    sections.push({
      key: "dagens-match",
      title: "Dagens match",
      items: [inputs.todayMatch],
    });
  }

  const leagueItems = dedupeAndCap(inputs.leagueItems);
  if (leagueItems.length > 0) {
    sections.push({
      key: "allsvenskan",
      title: "Allsvenskan som rör dig",
      items: leagueItems,
    });
  }

  const topItems = dedupeAndCap(inputs.topImportance);
  if (topItems.length > 0) {
    sections.push({ key: "vart-att-veta", title: "Värt att veta", items: topItems });
  }

  return {
    minutes,
    generatedAt: new Date().toISOString(),
    sections,
    isEmpty: sections.length === 0,
  };
}

/** Injectable data access so composition can be tested without a DB. */
export type PersonalDailyDataAccessor = {
  getFollowedTeamNews: (
    followedTeamIds: string[],
    sinceIso: string,
  ) => Promise<PersonalDailyItem[]>;
  getTodayMatch: () => Promise<PersonalDailyItem | null>;
  getLeagueItemsTouchingTeams: (
    followedTeamIds: string[],
    sinceIso: string,
  ) => Promise<PersonalDailyItem[]>;
  getTopImportanceItems: (sinceIso: string) => Promise<PersonalDailyItem[]>;
};

function mapRow(row: {
  id: string;
  title: string;
  url: string | null;
  slug: string | null;
  source_name: string | null;
  published_at: string;
  rights_status: string | null;
  is_athopia_generated: boolean | null;
}): PersonalDailyItem {
  return {
    id: row.id,
    title: row.title,
    href: articlePublicPath({
      slug: row.slug,
      rights_status: row.rights_status,
      is_athopia_generated: row.is_athopia_generated,
      url: row.url,
    }),
    sourceName: row.source_name,
    publishedAt: row.published_at,
  };
}

/** Real Supabase-backed accessor — `db` is `createServerClient()` from `lib/supabase.ts`. */
export function createSupabasePersonalDailyAccessor(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  db: any,
): PersonalDailyDataAccessor {
  const SELECT =
    "id, title, url, slug, source_name, published_at, importance_score, rights_status, is_athopia_generated, news_tag, entity_ids";

  return {
    async getFollowedTeamNews(followedTeamIds, sinceIso) {
      if (followedTeamIds.length === 0) return [];
      let q = db
        .from("news_feed_clustered")
        .select(SELECT)
        .eq("sport", "football")
        .gt("published_at", sinceIso)
        .order("importance_score", { ascending: false, nullsFirst: false })
        .limit(20);
      q =
        followedTeamIds.length === 1
          ? q.contains("entity_ids", [followedTeamIds[0]])
          : q.overlaps("entity_ids", followedTeamIds);
      const { data, error } = await q;
      if (error || !data) return [];
      return (data as Parameters<typeof mapRow>[0][]).map(mapRow);
    },

    async getTodayMatch() {
      const favorite = await getFavoriteTeamMatchToday();
      if (!favorite) return null;
      const { teamName, match } = favorite;
      return {
        id: `match:${match.sportmonks_id}`,
        title: `${match.home_team_name} vs ${match.away_team_name} (${teamName})`,
        href: `/match/${match.sportmonks_id}`,
        sourceName: null,
        publishedAt: match.kickoff_at ?? new Date().toISOString(),
      };
    },

    async getLeagueItemsTouchingTeams(followedTeamIds, sinceIso) {
      if (followedTeamIds.length === 0) return [];
      let q = db
        .from("news_feed_clustered")
        .select(SELECT)
        .eq("sport", "football")
        .eq("news_tag", "league")
        .gt("published_at", sinceIso)
        .order("importance_score", { ascending: false, nullsFirst: false })
        .limit(20);
      q =
        followedTeamIds.length === 1
          ? q.contains("entity_ids", [followedTeamIds[0]])
          : q.overlaps("entity_ids", followedTeamIds);
      const { data, error } = await q;
      if (error || !data) return [];
      return (data as Parameters<typeof mapRow>[0][]).map(mapRow);
    },

    async getTopImportanceItems(sinceIso) {
      const { data, error } = await db
        .from("news_feed_clustered")
        .select(SELECT)
        .eq("sport", "football")
        .gt("published_at", sinceIso)
        .order("importance_score", { ascending: false, nullsFirst: false })
        .limit(20);
      if (error || !data) return [];
      return (data as Parameters<typeof mapRow>[0][]).map(mapRow);
    },
  };
}

const SINCE_HOURS = 24;

/** Server accessor-backed entry point — reads user's followed teams + today's match + feed. */
export async function getPersonalDaily(
  userId: string,
  minutes: number,
): Promise<PersonalDaily> {
  if (!isSupabaseConfigured()) {
    return buildPersonalDaily(
      { followedTeamNews: [], todayMatch: null, leagueItems: [], topImportance: [] },
      minutes,
    );
  }

  const db = createServerClient();
  const accessor = createSupabasePersonalDailyAccessor(db);
  const sinceIso = new Date(Date.now() - SINCE_HOURS * 3_600_000).toISOString();

  const { data: feedConfig } = await db
    .from("user_feed_config")
    .select("followed_team_ids")
    .eq("clerk_user_id", userId)
    .eq("sport", "football")
    .maybeSingle();
  const followedTeamIds: string[] = feedConfig?.followed_team_ids ?? [];

  const [followedTeamNews, todayMatch, leagueItems, topImportance] = await Promise.all([
    accessor.getFollowedTeamNews(followedTeamIds, sinceIso),
    accessor.getTodayMatch(),
    accessor.getLeagueItemsTouchingTeams(followedTeamIds, sinceIso),
    accessor.getTopImportanceItems(sinceIso),
  ]);

  return buildPersonalDaily(
    { followedTeamNews, todayMatch, leagueItems, topImportance },
    minutes,
  );
}
