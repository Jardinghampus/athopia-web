/**
 * lib/team-hub/queries.ts — Team Hub aggregeringslager
 * ─────────────────────────────────────────────────────────────────────────────
 * All statistik hämtas från Supabase (synkad av athopia-os från Sportmonks):
 *   team_season_stats   (team_id = sportmonks_id, season_id)
 *   player_season_stats (team_id, season_id, players-join)
 *   fixtures            (home_team_id/away_team_id = sportmonks_id)
 * Inga hårdkodade värden — allt dynamiskt, normaliserat mot ligan.
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { createServerClient, isSupabaseConfigured } from "@/lib/supabase";
import { getTeamNews, getTeamThreads } from "@/lib/dashboard/queries";
import type { DashArticle, DashThread } from "@/lib/dashboard/types";

export const SEASON_2026 = 26806;
const SPORT = "football";

export interface TeamSeasonRow {
  team_id: number;
  played: number;
  wins: number;
  draws: number;
  losses: number;
  goals_for: number;
  goals_against: number;
  goal_diff: number;
  points: number;
  position: number | null;
  xg: number | null;
  xga: number | null;
  possession: number | null;
  [k: string]: unknown;
}

function shapeLeagueSeasonStats(rows: Record<string, unknown>[]): TeamSeasonRow[] {
  const shaped = rows.map((row) => ({
    ...row,
    goal_diff: Number(row.goal_diff ?? Number(row.goals_for ?? 0) - Number(row.goals_against ?? 0)),
    xg: row.xg ?? row.xg_for ?? null,
    xga: row.xga ?? row.xg_against ?? null,
  })) as TeamSeasonRow[];

  const ranked = [...shaped].sort(
    (a, b) =>
      Number(b.points ?? 0) - Number(a.points ?? 0) ||
      Number(b.goal_diff ?? 0) - Number(a.goal_diff ?? 0) ||
      Number(b.goals_for ?? 0) - Number(a.goals_for ?? 0)
  );
  const positionByTeam = new Map(ranked.map((team, index) => [team.team_id, index + 1]));

  return shaped.map((row) => ({
    ...row,
    position: row.position ?? positionByTeam.get(row.team_id) ?? null,
  }));
}

export interface LeaderRow {
  player_id: number;
  fullname: string;
  slug: string | null;
  image: string | null;
  position: string | null;
  goals: number;
  assists: number;
  appearances: number;
  minutes: number;
  shots: number;
  shots_on_target: number;
  xg: number;
  xa: number;
  rating: number | null;
  yellow_cards: number;
  red_cards: number;
}

export interface FixtureRow {
  sportmonks_id: number;
  home_team_id: number;
  away_team_id: number;
  home_team_name: string;
  away_team_name: string;
  home_score: number | null;
  away_score: number | null;
  kickoff_at: string | null;
  status: string;
}

/** Hela ligans säsongsstatistik — används för normalisering + tabellposition. */
export async function getLeagueSeasonStats(): Promise<TeamSeasonRow[]> {
  if (!isSupabaseConfigured()) return [];
  try {
    const db = createServerClient();
    const { data } = await db
      .from("team_season_stats")
      .select("*")
      .eq("season_id", SEASON_2026);
    return shapeLeagueSeasonStats((data ?? []) as Record<string, unknown>[]);
  } catch {
    return [];
  }
}

export async function getTeamLeaders(teamSmId: number): Promise<LeaderRow[]> {
  if (!isSupabaseConfigured()) return [];
  try {
    const db = createServerClient();
    const { data: stats } = await db
      .from("player_season_stats")
      .select("player_id,goals,assists,appearances,minutes,shots,shots_on_target,xg,xa,rating,yellow_cards,red_cards")
      .eq("team_id", teamSmId)
      .eq("season_id", SEASON_2026);

    const rows = (stats ?? []) as Record<string, unknown>[];
    const playerIds = rows.map((r) => Number(r.player_id)).filter(Boolean);
    const { data: players } = playerIds.length
      ? await db.from("players").select("sportmonks_id,fullname,position,image,slug").in("sportmonks_id", playerIds)
      : { data: [] };
    const playerById = new Map(
      ((players ?? []) as Record<string, unknown>[]).map((p) => [Number(p.sportmonks_id), p])
    );

    return rows.map((r: Record<string, unknown>) => {
      const playerId = Number(r.player_id ?? 0);
      const p = playerById.get(playerId);
      return {
        player_id: playerId,
        fullname: (p?.fullname as string) ?? `Spelare ${playerId}`,
        slug: (p?.slug as string | null) ?? null,
        image: (p?.image as string | null) ?? null,
        position: (p?.position as string | null) ?? null,
        goals: Number(r.goals ?? 0),
        assists: Number(r.assists ?? 0),
        appearances: Number(r.appearances ?? 0),
        minutes: Number(r.minutes ?? 0),
        shots: Number(r.shots ?? 0),
        shots_on_target: Number(r.shots_on_target ?? 0),
        xg: Number(r.xg ?? 0),
        xa: Number(r.xa ?? 0),
        rating: r.rating == null ? null : Number(r.rating),
        yellow_cards: Number(r.yellow_cards ?? 0),
        red_cards: Number(r.red_cards ?? 0),
      };
    });
  } catch {
    return [];
  }
}

export async function getTeamFixtures(teamSmId: number): Promise<{ recent: FixtureRow[]; upcoming: FixtureRow[] }> {
  if (!isSupabaseConfigured()) return { recent: [], upcoming: [] };
  try {
    const db = createServerClient();
    const cols = "sportmonks_id,home_team_id,away_team_id,home_team_name,away_team_name,home_score,away_score,kickoff_at,status";
    const [{ data: recent }, { data: upcoming }] = await Promise.all([
      db.from("fixtures").select(cols)
        .eq("season_id", SEASON_2026).eq("status", "FT")
        .or(`home_team_id.eq.${teamSmId},away_team_id.eq.${teamSmId}`)
        .order("kickoff_at", { ascending: false }).limit(5),
      db.from("fixtures").select(cols)
        .eq("season_id", SEASON_2026).in("status", ["NS", "LIVE"])
        .or(`home_team_id.eq.${teamSmId},away_team_id.eq.${teamSmId}`)
        .order("kickoff_at", { ascending: true }).limit(3),
    ]);
    return { recent: (recent ?? []) as FixtureRow[], upcoming: (upcoming ?? []) as FixtureRow[] };
  } catch {
    return { recent: [], upcoming: [] };
  }
}

/** W/D/L-form från senaste matcherna (äldst → nyast). */
export function deriveForm(recent: FixtureRow[], teamSmId: number): ("W" | "D" | "L")[] {
  return [...recent]
    .reverse()
    .map((f) => {
      const isHome = f.home_team_id === teamSmId;
      const gf = (isHome ? f.home_score : f.away_score) ?? 0;
      const ga = (isHome ? f.away_score : f.home_score) ?? 0;
      return gf > ga ? "W" : gf === ga ? "D" : "L";
    });
}

// ── Aggregerad hub-payload (för interaktiv dashboard + API) ───────────────────

export interface TeamHubPayload {
  team: { id: string; name: string; slug: string; logo_url: string | null; sportsmonks_id: number | null };
  position: number | null;
  stats: TeamSeasonRow | null;
  form: ("W" | "D" | "L")[];
  radar: { metric: string; value: number; raw: number }[];
  topScorers: LeaderRow[];
  topAssists: LeaderRow[];
  squad: LeaderRow[];
  recent: FixtureRow[];
  upcoming: FixtureRow[];
  news: DashArticle[];
  threads: DashThread[];
}

const RADAR_DEF: { key: keyof TeamSeasonRow; label: string; invert?: boolean }[] = [
  { key: "goals_for", label: "Anfall" },
  { key: "goals_against", label: "Försvar", invert: true },
  { key: "points", label: "Poäng" },
  { key: "xg", label: "xG" },
  { key: "possession", label: "Boll%" },
  { key: "goal_diff", label: "Målskillnad" },
];

/** Hämtar och aggregerar hela hub-payloaden för ett lag (slug). */
export async function getTeamHub(slug: string): Promise<TeamHubPayload | null> {
  const { MOCK_TEAM_SLUG, mockTeamHub } = await import("./mock");
  if (slug === MOCK_TEAM_SLUG) return mockTeamHub();
  if (!isSupabaseConfigured()) return null;
  const db = createServerClient();
  const { data } = await db.from("entities").select("*").eq("type", "team").eq("slug", slug).maybeSingle();
  if (!data) return null;
  const meta = (data.metadata ?? {}) as Record<string, unknown>;
  const smId = (meta.sportsmonks_id as number | null) ?? null;
  const team = {
    id: String(data.id),
    name: String(data.name),
    slug: String(data.slug),
    logo_url: (meta.logo_url as string | null) ?? null,
    sportsmonks_id: smId,
  };

  const [news, threads] = await Promise.all([getTeamNews(slug), getTeamThreads(team.id)]);

  if (!smId) {
    return { team, position: null, stats: null, form: [], radar: [], topScorers: [], topAssists: [], squad: [], recent: [], upcoming: [], news, threads };
  }

  const [league, leaders, fixtures] = await Promise.all([
    getLeagueSeasonStats(),
    getTeamLeaders(smId),
    getTeamFixtures(smId),
  ]);

  const stats = league.find((t) => t.team_id === smId) ?? null;
  const sorted = [...league].sort((a, b) => (b.points - a.points) || (b.goal_diff - a.goal_diff));
  const position = stats?.position ?? (stats ? sorted.findIndex((t) => t.team_id === smId) + 1 : null);
  const form = deriveForm(fixtures.recent, smId);
  const radar = stats ? normalizeAgainstLeague(league, stats, RADAR_DEF) : [];
  const topScorers = [...leaders].sort((a, b) => b.goals - a.goals).slice(0, 5);
  const topAssists = [...leaders].sort((a, b) => b.assists - a.assists).slice(0, 5);
  const squad = [...leaders].sort((a, b) => b.appearances - a.appearances);

  return { team, position, stats, form, radar, topScorers, topAssists, squad, recent: fixtures.recent, upcoming: fixtures.upcoming, news, threads };
}

/** z-score-normalisering → 0–100-skala, för radar-profilering mot ligan. */
export function normalizeAgainstLeague(
  league: TeamSeasonRow[],
  team: TeamSeasonRow,
  metrics: { key: keyof TeamSeasonRow; label: string; invert?: boolean }[]
): { metric: string; value: number; raw: number }[] {
  return metrics.map(({ key, label, invert }) => {
    const vals = league.map((t) => Number(t[key] ?? 0)).filter((v) => !Number.isNaN(v));
    const raw = Number(team[key] ?? 0);
    if (vals.length < 2) return { metric: label, value: 50, raw };
    const mean = vals.reduce((a, b) => a + b, 0) / vals.length;
    const std = Math.sqrt(vals.reduce((a, b) => a + (b - mean) ** 2, 0) / vals.length) || 1;
    let z = (raw - mean) / std;
    if (invert) z = -z;
    // klipp z till ±2.5 och skala till 0–100
    const clamped = Math.max(-2.5, Math.min(2.5, z));
    return { metric: label, value: Math.round(((clamped + 2.5) / 5) * 100), raw };
  });
}
