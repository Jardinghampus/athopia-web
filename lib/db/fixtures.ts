/**
 * lib/db/fixtures.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Supabase-baserade queries för matchdata.
 * Ersätter direkta Sportmonks API-anrop — data synkas av athopia-os.
 *
 * Flöde: Sportmonks → athopia-os sync-jobb → Supabase → denna fil → web
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { unstable_cache } from "next/cache";
import * as Sentry from "@sentry/nextjs";
import { createServerClient, isSupabaseConfigured } from "@/lib/supabase";

// ─── Typer ────────────────────────────────────────────────────────────────────

export interface SMTeam {
  id: number;
  name: string;
  short_code: string | null;
  image_path: string;
  slug: string | null;
}

export interface SMParticipant {
  id: number;
  name: string;
  image_path: string;
  slug: string | null;
  meta: {
    location: "home" | "away";
    winner: boolean | null;
  };
}

export interface SMFixture {
  id: number;
  name: string;
  starting_at: string;
  state: {
    id: number;
    state: string;
    short_name: string;
  };
  participants: SMParticipant[];
  scores: Array<{
    score: { goals: number; participant: "home" | "away" };
  }>;
  league: { name: string; image_path: string };
  periods?: Array<{
    minutes: number | null;
    type_id: number;
    has_timer: boolean;
  }>;
}

export interface SMTeamStats {
  team: SMTeam;
  position: number | null;
  goals_for: number;
  goals_against: number;
  wins: number;
  draws: number;
  losses: number;
  form: string[];
}

export interface SMStandingRow {
  team: SMTeam;
  position: number;
  played: number;
  wins: number;
  draws: number;
  losses: number;
  goals_for: number;
  goals_against: number;
  goal_diff: number;
  points: number;
  form: string[];
}

export interface SMTopScorer {
  rank: number;
  player_id: number;
  player_name: string;
  team_name: string;
  team_slug: string | null;
  team_image: string;
  goals: number;
  penalties: number;
}

export interface SMTopAssist {
  rank: number;
  player_id: number;
  player_name: string;
  team_name: string;
  team_slug: string | null;
  team_image: string;
  assists: number;
}

// ─── Interna helpers ──────────────────────────────────────────────────────────

/** sportmonks_id → entities.slug, för korrekta /lag/[slug]-länkar. ISR 3600s. */
export const getTeamSlugMap = unstable_cache(
  async (): Promise<Record<number, string>> => {
    if (!isSupabaseConfigured()) return {};
    try {
      const db = createServerClient();
      const { data } = await db
        .from("entities")
        .select("sportmonks_id,slug")
        .eq("type", "team")
        .not("sportmonks_id", "is", null)
        .not("slug", "is", null);
      const map: Record<number, string> = {};
      for (const row of data ?? []) {
        if (row.sportmonks_id != null && row.slug) map[Number(row.sportmonks_id)] = String(row.slug);
      }
      return map;
    } catch (e) {
      Sentry.captureException(e);
      return {};
    }
  },
  ["team-slug-map"],
  { revalidate: 3600, tags: ["teams"] }
);

function fallbackSlugify(name: string): string {
  return name.toLowerCase().replace(/\s+/g, "-").replace(/[åä]/g, "a").replace(/ö/g, "o");
}

function fixtureToSMFixture(row: any, slugMap: Record<number, string> = {}): SMFixture {
  const homeTeam = row.home_team ?? { sportmonks_id: 0, name: "Hemmalag", short_code: null, logo: "" };
  const awayTeam = row.away_team ?? { sportmonks_id: 0, name: "Bortalag", short_code: null, logo: "" };

  const stateStr = row.status ?? "NS";
  const isLive = stateStr === "LIVE" || stateStr === "inprogress";

  return {
    id: Number(row.sportmonks_id ?? row.id ?? 0),
    name: `${homeTeam.name} vs ${awayTeam.name}`,
    starting_at: row.kickoff ?? row.starting_at ?? new Date().toISOString(),
    state: {
      id: isLive ? 3 : stateStr === "FT" ? 5 : 1,
      state: isLive ? "inprogress" : stateStr === "FT" ? "FT" : "NS",
      short_name: stateStr,
    },
    participants: [
      {
        id: Number(homeTeam.sportmonks_id ?? 0),
        name: homeTeam.name ?? "",
        image_path: homeTeam.logo ?? "",
        slug: slugMap[Number(homeTeam.sportmonks_id)] ?? (homeTeam.name ? fallbackSlugify(homeTeam.name) : null),
        meta: { location: "home", winner: row.home_score != null && row.away_score != null ? row.home_score > row.away_score : null },
      },
      {
        id: Number(awayTeam.sportmonks_id ?? 0),
        name: awayTeam.name ?? "",
        image_path: awayTeam.logo ?? "",
        slug: slugMap[Number(awayTeam.sportmonks_id)] ?? (awayTeam.name ? fallbackSlugify(awayTeam.name) : null),
        meta: { location: "away", winner: row.home_score != null && row.away_score != null ? row.away_score > row.home_score : null },
      },
    ],
    scores: [
      ...(row.home_score != null ? [{ score: { goals: Number(row.home_score), participant: "home" as const } }] : []),
      ...(row.away_score != null ? [{ score: { goals: Number(row.away_score), participant: "away" as const } }] : []),
    ],
    league: {
      name: row.league?.name ?? "Allsvenskan",
      image_path: row.league?.logo ?? "",
    },
    ...(isLive ? {
      periods: [{ minutes: row.minute ?? null, type_id: 1, has_timer: true }],
    } : {}),
  };
}

function teamToSMTeam(row: any, slugMap: Record<number, string> = {}): SMTeam {
  const smId = Number(row.sportmonks_id ?? row.id ?? 0);
  const name = String(row.name ?? "");
  return {
    id: smId,
    name,
    short_code: row.short_code ?? null,
    image_path: row.logo ?? row.image_path ?? "",
    slug: slugMap[smId] ?? (name ? fallbackSlugify(name) : null),
  };
}

// ─── Queries ──────────────────────────────────────────────────────────────────

/** Live-matcher från Supabase (synkas var 60s av athopia-os). ISR 30s. */
export const fetchLiveScores = unstable_cache(
  async (): Promise<SMFixture[]> => {
    if (!isSupabaseConfigured()) return [];
    try {
      const db = createServerClient();
      const [{ data }, slugMap] = await Promise.all([
        db
          .from("fixtures")
          .select("*, home_team:teams!fixtures_home_team_id_fkey(*), away_team:teams!fixtures_away_team_id_fkey(*), league:leagues(*)")
          .eq("sport", "football")
          .eq("status", "LIVE")
          .order("kickoff", { ascending: true }),
        getTeamSlugMap(),
      ]);
      return (data ?? []).map((row) => fixtureToSMFixture(row, slugMap));
    } catch (e) {
      Sentry.captureException(e);
      return [];
    }
  },
  ["live-scores"],
  { revalidate: 30, tags: ["fixtures", "live"] }
);

/** Allsvenskan-matcher för aktuell säsong. ISR 60s. */
export const fetchAllsvenskanFixtures = unstable_cache(
  async (): Promise<SMFixture[]> => {
    if (!isSupabaseConfigured()) return [];
    try {
      const db = createServerClient();

      // Hitta aktuell säsong
      const { data: season } = await db
        .from("seasons")
        .select("sportmonks_id")
        .eq("sport", "football")
        .eq("is_current", true)
        .maybeSingle();

      let q = db
        .from("fixtures")
        .select("*, home_team:teams!fixtures_home_team_id_fkey(*), away_team:teams!fixtures_away_team_id_fkey(*), league:leagues(*)")
        .eq("sport", "football")
        .order("kickoff", { ascending: true })
        .limit(200);

      if (season?.sportmonks_id) {
        q = q.eq("season_id", season.sportmonks_id);
      }

      const [{ data }, slugMap] = await Promise.all([q, getTeamSlugMap()]);
      return (data ?? []).map((row) => fixtureToSMFixture(row, slugMap));
    } catch (e) {
      Sentry.captureException(e);
      return [];
    }
  },
  ["allsvenskan-fixtures"],
  { revalidate: 60, tags: ["fixtures"] }
);

/** Standings för ett lag. ISR 3600s. */
export const fetchTeamStats = unstable_cache(
  async (teamId: number): Promise<SMTeamStats | null> => {
    if (!isSupabaseConfigured()) return null;
    try {
      const standings = await fetchStandingsFull();
      const row = standings.find((s) => s.team.id === teamId);
      if (!row) return null;
      return {
        team: row.team,
        position: row.position,
        goals_for: row.goals_for,
        goals_against: row.goals_against,
        wins: row.wins,
        draws: row.draws,
        losses: row.losses,
        form: row.form,
      };
    } catch (e) {
      Sentry.captureException(e);
      return null;
    }
  },
  ["team-stats"],
  { revalidate: 3600, tags: ["standings"] }
);

/** Enkel standings-lista. ISR 3600s. */
export const fetchStandings = unstable_cache(
  async (): Promise<SMTeamStats[]> => {
    if (!isSupabaseConfigured()) return [];
    const full = await fetchStandingsFull();
    return full.map((r) => ({
      team: r.team,
      position: r.position,
      goals_for: r.goals_for,
      goals_against: r.goals_against,
      wins: r.wins,
      draws: r.draws,
      losses: r.losses,
      form: r.form,
    }));
  },
  ["standings-simple"],
  { revalidate: 3600, tags: ["standings"] }
);

/** Full standings med points, played, goal_diff. ISR 3600s. */
export const fetchStandingsFull = unstable_cache(
  async (_seasonId?: string): Promise<SMStandingRow[]> => {
    if (!isSupabaseConfigured()) return [];
    try {
      const db = createServerClient();

      const { data: season } = await db
        .from("seasons")
        .select("sportmonks_id")
        .eq("sport", "football")
        .eq("is_current", true)
        .maybeSingle();

      if (!season?.sportmonks_id) return [];

      const { data } = await db
        .from("team_season_stats")
        .select("*")
        .eq("season_id", season.sportmonks_id)
        .order("points", { ascending: false });

      const teamIds = (data ?? []).map((r) => r.team_id as number).filter(Boolean);
      const [{ data: teamsData }, slugMap] = await Promise.all([
        teamIds.length
          ? db.from("teams").select("sportmonks_id,name,short_code,logo").in("sportmonks_id", teamIds)
          : Promise.resolve({ data: [] as any[] }),
        getTeamSlugMap(),
      ]);
      const teamById = new Map((teamsData ?? []).map((t) => [Number(t.sportmonks_id), t]));

      return (data ?? []).map((row, i) => {
        const team = teamById.get(Number(row.team_id)) as any;
        const form = typeof row.form === "string"
          ? row.form.split("").filter((c: string) => ["W", "D", "L"].includes(c)).slice(-5)
          : [];
        return {
          team: teamToSMTeam(team ?? {}, slugMap),
          position: i + 1,
          played: Number(row.played ?? 0),
          wins: Number(row.wins ?? 0),
          draws: Number(row.draws ?? 0),
          losses: Number(row.losses ?? 0),
          goals_for: Number(row.goals_for ?? 0),
          goals_against: Number(row.goals_against ?? 0),
          goal_diff: Number(row.goals_for ?? 0) - Number(row.goals_against ?? 0),
          points: Number(row.points ?? 0),
          form,
        };
      });
    } catch (e) {
      Sentry.captureException(e);
      return [];
    }
  },
  ["standings-full"],
  { revalidate: 3600, tags: ["standings"] }
);

/** Toppskytt från player_season_stats. ISR 3600s. */
export const fetchTopScorers = unstable_cache(
  async (_seasonId?: string): Promise<SMTopScorer[]> => {
    if (!isSupabaseConfigured()) return [];
    try {
      const db = createServerClient();

      const { data: season } = await db
        .from("seasons")
        .select("sportmonks_id")
        .eq("sport", "football")
        .eq("is_current", true)
        .maybeSingle();

      if (!season?.sportmonks_id) return [];

      const [{ data }, slugMap] = await Promise.all([
        db
          .from("player_season_stats")
          .select("*, players(*), teams(*)")
          .eq("season_id", season.sportmonks_id)
          .order("goals", { ascending: false })
          .limit(50),
        getTeamSlugMap(),
      ]);

      return (data ?? []).map((row, i) => {
        const player = row.players as any;
        const team = row.teams as any;
        return {
          rank: i + 1,
          player_id: Number(row.player_id ?? 0),
          player_name: String(player?.fullname ?? player?.firstname ?? `Spelare ${i + 1}`),
          team_name: String(team?.name ?? "Okänt"),
          team_slug: slugMap[Number(team?.sportmonks_id)] ?? (team?.name ? fallbackSlugify(String(team.name)) : null),
          team_image: String(team?.logo ?? ""),
          goals: Number(row.goals ?? 0),
          penalties: 0,
        };
      });
    } catch (e) {
      Sentry.captureException(e);
      return [];
    }
  },
  ["top-scorers"],
  { revalidate: 3600, tags: ["stats"] }
);

/** Toppassisters från player_season_stats. ISR 3600s. */
export const fetchTopAssists = unstable_cache(
  async (_seasonId?: string): Promise<SMTopAssist[]> => {
    if (!isSupabaseConfigured()) return [];
    try {
      const db = createServerClient();

      const { data: season } = await db
        .from("seasons")
        .select("sportmonks_id")
        .eq("sport", "football")
        .eq("is_current", true)
        .maybeSingle();

      if (!season?.sportmonks_id) return [];

      const [{ data }, slugMap] = await Promise.all([
        db
          .from("player_season_stats")
          .select("*, players(*), teams(*)")
          .eq("season_id", season.sportmonks_id)
          .order("assists", { ascending: false })
          .limit(50),
        getTeamSlugMap(),
      ]);

      return (data ?? []).map((row, i) => {
        const player = row.players as any;
        const team = row.teams as any;
        return {
          rank: i + 1,
          player_id: Number(row.player_id ?? 0),
          player_name: String(player?.fullname ?? player?.firstname ?? `Spelare ${i + 1}`),
          team_name: String(team?.name ?? "Okänt"),
          team_slug: slugMap[Number(team?.sportmonks_id)] ?? (team?.name ? fallbackSlugify(String(team.name)) : null),
          team_image: String(team?.logo ?? ""),
          assists: Number(row.assists ?? 0),
        };
      });
    } catch (e) {
      Sentry.captureException(e);
      return [];
    }
  },
  ["top-assists"],
  { revalidate: 3600, tags: ["stats"] }
);

/** Sök lag i Supabase teams-tabellen. */
export async function searchTeams(query: string): Promise<SMTeam[]> {
  if (!isSupabaseConfigured()) return [];
  try {
    const db = createServerClient();
    const [{ data }, slugMap] = await Promise.all([
      db.from("teams").select("*").eq("sport", "football").ilike("name", `%${query}%`).limit(20),
      getTeamSlugMap(),
    ]);
    return (data ?? []).map((row) => teamToSMTeam(row, slugMap));
  } catch (e) {
    Sentry.captureException(e);
    return [];
  }
}

/** Spelarstatistik från player_match_stats. */
export async function fetchPlayerStats(playerId: number): Promise<any | null> {
  if (!isSupabaseConfigured()) return null;
  try {
    const db = createServerClient();
    const { data } = await db
      .from("player_season_stats")
      .select("*, players(*)")
      .eq("player_id", playerId)
      .maybeSingle();
    return data ?? null;
  } catch (e) {
    Sentry.captureException(e);
    return null;
  }
}

/** Helper: omvandla fixture till visningsvänlig form (bakåtkompatibel). */
export function parseFixtureScore(fixture: SMFixture) {
  const home = fixture.participants?.find((p) => p.meta.location === "home");
  const away = fixture.participants?.find((p) => p.meta.location === "away");
  const homeGoals = fixture.scores?.find((s) => s.score.participant === "home")?.score.goals ?? null;
  const awayGoals = fixture.scores?.find((s) => s.score.participant === "away")?.score.goals ?? null;
  const liveMinute = fixture.periods?.find((p) => p.has_timer)?.minutes ?? null;
  const isLive = fixture.state?.state === "inprogress";
  return { home, away, homeGoals, awayGoals, liveMinute, isLive };
}
