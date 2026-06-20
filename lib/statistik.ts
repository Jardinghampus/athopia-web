/**
 * Statistik-datalager — läser Supabase-tabellerna som athopia-os fyller:
 *   teams, players, fixtures, team_season_stats, player_season_stats.
 *
 * Flöde: Sportmonks → athopia-os sync-jobb → Supabase → athopia-web.
 * athopia-web läser ENBART från Supabase — inga direkta Sportmonks-anrop.
 *
 * Tabellen härleds ur fixtures (status='FT') eftersom team_season_stats
 * saknar insläppta mål/poäng/position. Säsonger: 2026=26806, 2025=24943.
 */
import { unstable_cache } from "next/cache";
import { createServerClient, isSupabaseConfigured } from "@/lib/supabase";

export const SEASON_IDS: Record<string, string> = {
  "2026": process.env.SPORTSMONKS_SEASON_ID_2026 ?? "26806",
  "2025": process.env.SPORTSMONKS_SEASON_ID_2025 ?? "24943",
};

// Cache-fönster: syncen (Hetzner) kör var 30:e min → 5 min cache är färskt nog
// och delar den tunga fixture-aggregationen mellan ALLA besökare istället för
// att köra en ny Supabase-query per sidladdning. Lag ändras sällan → 1h.
const STATS_REVALIDATE = 300;
const TEAMS_REVALIDATE = 3600;

export interface StandingRow {
  position: number;
  team: { id: number; name: string; image_path: string | null };
  played: number;
  wins: number;
  draws: number;
  losses: number;
  goals_for: number;
  goals_against: number;
  goal_diff: number;
  points: number;
  form: string[]; // äldst → nyast, max 5
}

export interface ScorerRow {
  rank: number;
  player_id: number;
  player_name: string;
  team_name: string;
  slug: string | null;
  image: string | null;
  position: string | null;
  appearances: number;
  minutes: number;
  goals: number;
  assists: number;
  penalties: number;
  xg: number;
  xa: number;
  shots: number;
  shots_on_target: number;
  key_passes: number;
  passes: number;
  pass_accuracy: number | null;
  tackles: number;
  interceptions: number;
  rating: number | null;
  yellow_cards: number;
  red_cards: number;
}

interface FixtureLite {
  home_team_id: number | string;
  away_team_id: number | string;
  home_score: number | null;
  away_score: number | null;
  kickoff_at: string | null;
}

type TeamLite = { id: number; name: string | null; logo_path: string | null };
type PlayerLite = {
  id: number;
  fullname: string;
  slug: string | null;
  image: string | null;
  position: string | null;
};
type LeaderMetric =
  | "goals"
  | "assists"
  | "xg"
  | "xa"
  | "rating"
  | "shots"
  | "key_passes"
  | "passes"
  | "tackles"
  | "yellow_cards";

// Cachead teams-lista (JSON-serialiserbar — Map byggs utanför cachen).
// OBS: faktiska kolumner är sportmonks_id + logo (inte id + logo_path).
const cachedTeams = unstable_cache(
  async (): Promise<TeamLite[]> => {
    if (!isSupabaseConfigured()) return [];
    try {
      const db = createServerClient();
      const { data } = await db.from("teams").select("sportmonks_id,name,logo");
      return ((data ?? []) as { sportmonks_id: number; name: string | null; logo: string | null }[]).map(
        (t) => ({ id: t.sportmonks_id, name: t.name, logo_path: t.logo })
      );
    } catch {
      return [];
    }
  },
  ["statistik:teams"],
  { revalidate: TEAMS_REVALIDATE, tags: ["statistik"] }
);

async function getTeamMap() {
  const teams = await cachedTeams();
  return new Map(
    teams.map((t) => [t.id, { name: t.name ?? `Lag ${t.id}`, image_path: t.logo_path }])
  );
}

// Cachead fixture-hämtning per säsong — delas mellan alla besökare.
const cachedSeasonFixtures = unstable_cache(
  async (seasonId: string): Promise<FixtureLite[]> => {
    if (!isSupabaseConfigured()) return [];
    try {
      const db = createServerClient();
      const { data } = await db
        .from("fixtures")
        .select("home_team_id,away_team_id,home_score,away_score,kickoff_at")
        .eq("season_id", Number(seasonId))
        .eq("status", "FT")
        .not("home_score", "is", null) // FT utan resultat (sync-glapp) skulle korrupta tabellen
        .order("kickoff_at", { ascending: true });
      return (data ?? []) as FixtureLite[];
    } catch {
      return [];
    }
  },
  ["statistik:fixtures"],
  { revalidate: STATS_REVALIDATE, tags: ["statistik"] }
);

/** Ligatabell härledd ur spelade matcher i Supabase. Tom array = ingen data. */
export async function getStandingsFromDb(seasonId: string): Promise<StandingRow[]> {
  if (!isSupabaseConfigured()) return [];
  try {
    const [played, teamMap] = await Promise.all([
      cachedSeasonFixtures(seasonId),
      getTeamMap(),
    ]);
    if (played.length === 0) return [];

    const acc = new Map<number, StandingRow>();
    const ensure = (id: number): StandingRow => {
      let row = acc.get(id);
      if (!row) {
        const t = teamMap.get(id);
        row = {
          position: 0,
          team: { id, name: t?.name ?? `Lag ${id}`, image_path: t?.image_path ?? null },
          played: 0, wins: 0, draws: 0, losses: 0,
          goals_for: 0, goals_against: 0, goal_diff: 0, points: 0,
          form: [],
        };
        acc.set(id, row);
      }
      return row;
    };

    for (const f of played) {
      const hs = f.home_score ?? 0;
      const as = f.away_score ?? 0;
      // home_team_id är text, away_team_id är bigint i DB → normalisera
      const home = ensure(Number(f.home_team_id));
      const away = ensure(Number(f.away_team_id));
      home.played++; away.played++;
      home.goals_for += hs; home.goals_against += as;
      away.goals_for += as; away.goals_against += hs;
      if (hs > as) { home.wins++; away.losses++; home.form.push("W"); away.form.push("L"); }
      else if (hs < as) { away.wins++; home.losses++; away.form.push("W"); home.form.push("L"); }
      else { home.draws++; away.draws++; home.form.push("D"); away.form.push("D"); }
    }

    const rows = [...acc.values()].map((r) => ({
      ...r,
      goal_diff: r.goals_for - r.goals_against,
      points: r.wins * 3 + r.draws,
      form: r.form.slice(-5),
    }));
    rows.sort(
      (a, b) =>
        b.points - a.points ||
        b.goal_diff - a.goal_diff ||
        b.goals_for - a.goals_for ||
        a.team.name.localeCompare(b.team.name, "sv")
    );
    rows.forEach((r, i) => { r.position = i + 1; });
    return rows;
  } catch {
    return [];
  }
}

// Spelarnamn-map (players-PK = sportmonks_id, namnkolumn = fullname).
const cachedPlayers = unstable_cache(
  async (): Promise<Record<number, PlayerLite>> => {
    if (!isSupabaseConfigured()) return {};
    try {
      const db = createServerClient();
      const { data } = await db.from("players").select("sportmonks_id,fullname,slug,image,position");
      const map: Record<number, PlayerLite> = {};
      for (const p of (data ?? []) as Record<string, unknown>[]) {
        const id = Number(p.sportmonks_id);
        if (!id) continue;
        map[id] = {
          id,
          fullname: (p.fullname as string | null) ?? `Spelare ${id}`,
          slug: (p.slug as string | null) ?? null,
          image: (p.image as string | null) ?? null,
          position: (p.position as string | null) ?? null,
        };
      }
      return map;
    } catch {
      return {};
    }
  },
  ["statistik:players"],
  { revalidate: TEAMS_REVALIDATE, tags: ["statistik"] }
);

const cachedLeaderRows = unstable_cache(
  async (seasonId: string, orderCol: LeaderMetric): Promise<Record<string, unknown>[]> => {
    if (!isSupabaseConfigured()) return [];
    try {
      const db = createServerClient();
      let query = db
        .from("player_season_stats")
        .select("player_id,team_id,appearances,minutes,goals,assists,xg,xa,shots,shots_on_target,key_passes,passes,pass_accuracy,tackles,interceptions,rating,yellow_cards,red_cards")
        .eq("season_id", Number(seasonId))
        .order(orderCol, { ascending: false, nullsFirst: false })
        .order("minutes", { ascending: false })
        .limit(30);
      if (orderCol !== "rating") query = query.gt(orderCol, 0);
      const { data } = await query;
      return (data ?? []) as Record<string, unknown>[];
    } catch {
      return [];
    }
  },
  ["statistik:leaders"],
  { revalidate: STATS_REVALIDATE, tags: ["statistik"] }
);

async function getLeaders(
  seasonId: string,
  orderCol: LeaderMetric
): Promise<ScorerRow[]> {
  if (!isSupabaseConfigured()) return [];
  try {
    const [data, teamMap, playerMap] = await Promise.all([
      cachedLeaderRows(seasonId, orderCol),
      getTeamMap(),
      cachedPlayers(),
    ]);
    return (data as Record<string, unknown>[]).map((r, i) => {
      const pid = Number(r.player_id ?? 0);
      const player = playerMap[pid];
      return {
        rank: i + 1,
        player_id: pid,
        player_name: player?.fullname ?? `Spelare ${pid}`,
        team_name: teamMap.get(Number(r.team_id))?.name ?? "–",
        slug: player?.slug ?? null,
        image: player?.image ?? null,
        position: player?.position ?? null,
        appearances: Number(r.appearances ?? 0),
        minutes: Number(r.minutes ?? 0),
        goals: Number(r.goals ?? 0),
        assists: Number(r.assists ?? 0),
        penalties: 0, // dedikerad kolumn saknas i player_season_stats (finns ev. i raw_stats)
        xg: Number(r.xg ?? 0),
        xa: Number(r.xa ?? 0),
        shots: Number(r.shots ?? 0),
        shots_on_target: Number(r.shots_on_target ?? 0),
        key_passes: Number(r.key_passes ?? 0),
        passes: Number(r.passes ?? 0),
        pass_accuracy: r.pass_accuracy == null ? null : Number(r.pass_accuracy),
        tackles: Number(r.tackles ?? 0),
        interceptions: Number(r.interceptions ?? 0),
        rating: r.rating == null ? null : Number(r.rating),
        yellow_cards: Number(r.yellow_cards ?? 0),
        red_cards: Number(r.red_cards ?? 0),
      };
    });
  } catch {
    return [];
  }
}

export const getTopScorersFromDb = (seasonId: string) => getLeaders(seasonId, "goals");
export const getTopAssistsFromDb = (seasonId: string) => getLeaders(seasonId, "assists");
export const getTopXgFromDb = (seasonId: string) => getLeaders(seasonId, "xg");
export const getTopXaFromDb = (seasonId: string) => getLeaders(seasonId, "xa");
export const getTopRatingsFromDb = (seasonId: string) => getLeaders(seasonId, "rating");
export const getTopShotsFromDb = (seasonId: string) => getLeaders(seasonId, "shots");
export const getTopPassersFromDb = (seasonId: string) => getLeaders(seasonId, "passes");
export const getTopDefendersFromDb = (seasonId: string) => getLeaders(seasonId, "tackles");
export const getMostCardsFromDb = (seasonId: string) => getLeaders(seasonId, "yellow_cards");
