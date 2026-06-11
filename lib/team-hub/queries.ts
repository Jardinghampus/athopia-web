/**
 * lib/team-hub/queries.ts — Team Hub aggregeringslager
 * ─────────────────────────────────────────────────────────────────────────────
 * All statistik hämtas från Sportmonks-synkade Supabase-tabeller:
 *   team_season_stats   (team_id = sportmonks_id, season_id)
 *   player_season_stats (team_id, season_id, players-join)
 *   fixtures            (home_team_id/away_team_id = sportmonks_id)
 * Inga hårdkodade värden — allt dynamiskt, normaliserat mot ligan.
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { createServerClient, isSupabaseConfigured } from "@/lib/supabase";

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

export interface LeaderRow {
  player_id: number;
  fullname: string;
  slug: string | null;
  image: string | null;
  position: string | null;
  goals: number;
  assists: number;
  appearances: number;
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
    return (data ?? []) as TeamSeasonRow[];
  } catch {
    return [];
  }
}

export async function getTeamLeaders(teamSmId: number): Promise<LeaderRow[]> {
  if (!isSupabaseConfigured()) return [];
  try {
    const db = createServerClient();
    const { data } = await db
      .from("player_season_stats")
      .select("goals,assists,appearances,players(sportmonks_id,fullname,position,image,slug)")
      .eq("team_id", teamSmId)
      .eq("season_id", SEASON_2026);
    return (data ?? []).map((r: Record<string, unknown>) => {
      const p = (r.players ?? {}) as Record<string, unknown>;
      return {
        player_id: (p.sportmonks_id as number) ?? 0,
        fullname: (p.fullname as string) ?? "–",
        slug: (p.slug as string | null) ?? null,
        image: (p.image as string | null) ?? null,
        position: (p.position as string | null) ?? null,
        goals: (r.goals as number) ?? 0,
        assists: (r.assists as number) ?? 0,
        appearances: (r.appearances as number) ?? 0,
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
