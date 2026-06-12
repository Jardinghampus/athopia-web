/**
 * Statistik-datalager — läser Supabase-tabellerna som Hetzner-syncen
 * (Athopia Build/sportsmonks/allsvenskan-sync) fyller:
 *   teams, players, fixtures, team_season_stats, player_season_stats.
 *
 * Flöde: Sportmonks → allsvenskan-sync → Supabase → athopia-web.
 * Direkt-anrop mot Sportmonks-API:t används ENDAST som fallback
 * (lib/sportsmonks.ts) tills Supabase-datan är komplett.
 *
 * Tabellen härleds ur fixtures (status='FT') eftersom team_season_stats
 * saknar insläppta mål/poäng/position. Säsonger: 2026=26806, 2025=24943
 * (samma id:n som allsvenskan-sync/.env).
 */
import { createServerClient, isSupabaseConfigured } from "@/lib/supabase";

export const SEASON_IDS: Record<string, string> = {
  "2026": process.env.SPORTSMONKS_SEASON_ID_2026 ?? "26806",
  "2025": process.env.SPORTSMONKS_SEASON_ID_2025 ?? "24943",
};

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
  goals: number;
  assists: number;
  penalties: number;
}

interface FixtureLite {
  home_team_id: number;
  away_team_id: number;
  home_score: number | null;
  away_score: number | null;
  starting_at: string | null;
}

async function getTeamMap(db: ReturnType<typeof createServerClient>) {
  const { data } = await db.from("teams").select("id,name,logo_path");
  return new Map(
    (data ?? []).map((t: { id: number; name: string | null; logo_path: string | null }) => [
      t.id,
      { name: t.name ?? `Lag ${t.id}`, image_path: t.logo_path },
    ])
  );
}

/** Ligatabell härledd ur spelade matcher i Supabase. Tom array = ingen data. */
export async function getStandingsFromDb(seasonId: string): Promise<StandingRow[]> {
  if (!isSupabaseConfigured()) return [];
  try {
    const db = createServerClient();
    const [{ data: fixtures }, teamMap] = await Promise.all([
      db
        .from("fixtures")
        .select("home_team_id,away_team_id,home_score,away_score,starting_at")
        .eq("season_id", Number(seasonId))
        .eq("status", "FT")
        .order("starting_at", { ascending: true }),
      getTeamMap(db),
    ]);
    const played = (fixtures ?? []) as FixtureLite[];
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
      const home = ensure(f.home_team_id);
      const away = ensure(f.away_team_id);
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

async function getLeaders(
  seasonId: string,
  orderCol: "goals" | "assists"
): Promise<ScorerRow[]> {
  if (!isSupabaseConfigured()) return [];
  try {
    const db = createServerClient();
    const [{ data }, teamMap] = await Promise.all([
      db
        .from("player_season_stats")
        .select("player_id,team_id,goals,assists,players(name)")
        .eq("season_id", Number(seasonId))
        .gt(orderCol, 0)
        .order(orderCol, { ascending: false })
        .limit(30),
      getTeamMap(db),
    ]);
    return ((data ?? []) as Record<string, unknown>[]).map((r, i) => {
      const p = (r.players ?? {}) as { name?: string | null };
      return {
        rank: i + 1,
        player_id: (r.player_id as number) ?? 0,
        player_name: p.name ?? `Spelare ${r.player_id}`,
        team_name: teamMap.get(r.team_id as number)?.name ?? "–",
        goals: (r.goals as number) ?? 0,
        assists: (r.assists as number) ?? 0,
        penalties: 0, // dedikerad kolumn saknas i player_season_stats (finns ev. i raw_stats)
      };
    });
  } catch {
    return [];
  }
}

export const getTopScorersFromDb = (seasonId: string) => getLeaders(seasonId, "goals");
export const getTopAssistsFromDb = (seasonId: string) => getLeaders(seasonId, "assists");
