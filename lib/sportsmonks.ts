/**
 * lib/sportsmonks.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Wrapper kring Sportsmonks Football API v3.
 *
 * Beslut: Alla anrop använder Next.js fetch() med `revalidate: 60` (ISR).
 * Live-matchdata uppdateras var 60:e sekund utan att rebuilda hela appen.
 * Statisk data (lag, spelare, ligor) använder längre TTL (3600s).
 * ─────────────────────────────────────────────────────────────────────────────
 */

const BASE_URL = "https://api.sportmonks.com/v3/football";
const API_TOKEN = process.env.SPORTSMONKS_API_TOKEN ?? "";

// ─── Fetch-helper med ISR-cache ────────────────────────────────────────────────
async function smFetch<T>(
  path: string,
  params: Record<string, string> = {},
  revalidate = 60,
  timeoutMs = 8000
): Promise<T> {
  if (!API_TOKEN || API_TOKEN === "placeholder_token") {
    throw new Error("SPORTSMONKS_API_TOKEN saknas eller är placeholder.");
  }
  const url = new URL(`${BASE_URL}${path}`);
  url.searchParams.set("api_token", API_TOKEN);
  for (const [k, v] of Object.entries(params)) {
    url.searchParams.set(k, v);
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch(url.toString(), {
      next: { revalidate },
      headers: { Accept: "application/json" },
      signal: controller.signal,
    });

    if (!res.ok) {
      throw new Error(`Sportsmonks API fel ${res.status}: ${path}`);
    }

    const json = await res.json();
    return json.data as T;
  } finally {
    clearTimeout(timer);
  }
}

// ─── Typdefinitioner (Sportsmonks v3 subset) ──────────────────────────────────
export interface SMTeam {
  id: number;
  name: string;
  short_code: string | null;
  image_path: string;
}

export interface SMParticipant {
  id: number;
  name: string;
  image_path: string;
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
    state: string;         // "inprogress" | "FT" | "NS" osv
    short_name: string;
  };
  participants: SMParticipant[];
  scores: Array<{
    score: { goals: number; participant: "home" | "away" };
  }>;
  league: { name: string; image_path: string };
  // Tidsinformation för live-matcher
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
  form: string[]; // ["W","W","D","L","W"]
}

// ─── API-funktioner ────────────────────────────────────────────────────────────

/**
 * Hämta live och kommande matcher (ISR 60s).
 * Inkluderar poäng, lag, ligainfo.
 */
export async function fetchLiveScores(): Promise<SMFixture[]> {
  try {
    return await smFetch<SMFixture[]>(
      "/livescores/inplay",
      { include: "participants;scores;state;league;periods" },
      60
    );
  } catch (e) {
    console.error("Sportsmonks fetchLiveScores fel", e);
    return [];
  }
}

/**
 * Hämtar dagens matcher (ISR 60s).
 */
export async function fetchAllsvenskanFixtures(): Promise<SMFixture[]> {
  // Kräver att season/league sätts i env för exakt Allsvenskan. Faller tillbaka till "today".
  const seasonId = process.env.SPORTSMONKS_ALLSVENSKAN_SEASON_ID;
  try {
    if (seasonId) {
      return await smFetch<SMFixture[]>(
        `/fixtures/seasons/${seasonId}`,
        { include: "participants;scores;state;league;periods" },
        60
      );
    }
    return await smFetch<SMFixture[]>(
      "/fixtures/date/today",
      { include: "participants;scores;state;league" },
      60
    );
  } catch (e) {
    console.error("Sportsmonks fetchAllsvenskanFixtures fel", e);
    return [];
  }
}

/**
 * Hämta lagprofil med statistik (ISR 3600s).
 */
export async function fetchTeamStats(teamId: number): Promise<SMTeamStats | null> {
  try {
    // Placeholder: Sportsmonks har flera endpoints för stats; vi tar standings + form när säsong finns.
    const seasonId = process.env.SPORTSMONKS_ALLSVENSKAN_SEASON_ID;
    if (seasonId) {
      const standings = await fetchStandings();
      const row = standings.find((s) => s.team.id === teamId) ?? null;
      if (row) return row;
    }
    const team = await smFetch<SMTeam>(`/teams/${teamId}`, {}, 60);
    return {
      team,
      position: null,
      goals_for: 0,
      goals_against: 0,
      wins: 0,
      draws: 0,
      losses: 0,
      form: [],
    };
  } catch (e) {
    console.error("Sportsmonks fetchTeamStats fel", e);
    return null;
  }
}

/**
 * Hämta stående i en liga (ISR 3600s).
 */
export async function fetchStandings(): Promise<SMTeamStats[]> {
  const seasonId = process.env.SPORTSMONKS_ALLSVENSKAN_SEASON_ID;
  if (!seasonId) return [];
  try {
    const raw = await smFetch<
      Array<{
        participant: SMTeam;
        position: number;
        goals: { scored: number; conceded: number };
        won: number;
        draw: number;
        lost: number;
        form: string[];
      }>
    >(`/standings/seasons/${seasonId}`, {}, 60);

    return raw.map((row) => ({
      team: row.participant,
      position: row.position,
      goals_for: row.goals.scored,
      goals_against: row.goals.conceded,
      wins: row.won,
      draws: row.draw,
      losses: row.lost,
      form: row.form ?? [],
    }));
  } catch (e) {
    console.error("Sportsmonks fetchStandings fel", e);
    return [];
  }
}

/**
 * Sök efter lag via namn (ISR 3600s).
 */
export async function searchTeams(query: string): Promise<SMTeam[]> {
  return smFetch<SMTeam[]>(
    `/teams/search/${encodeURIComponent(query)}`,
    {},
    3600
  );
}

export async function fetchPlayerStats(playerId: number): Promise<any | null> {
  try {
    // Placeholder tills vi definierar Sportsmonks player-stats mapping fullt ut.
    const player = await smFetch<any>(`/players/${playerId}`, {}, 60);
    return player ?? null;
  } catch (e) {
    console.error("Sportsmonks fetchPlayerStats fel", e);
    return null;
  }
}

// ─── Utökade typer för statistik-sidan ────────────────────────────────────────

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
  form: string[]; // ["W","D","L","W","W"] — senaste 5
}

export interface SMTopScorer {
  rank: number;
  player_id: number;
  player_name: string;
  team_name: string;
  team_image: string;
  goals: number;
  penalties: number;
}

export interface SMTopAssist {
  rank: number;
  player_id: number;
  player_name: string;
  team_name: string;
  team_image: string;
  assists: number;
}

/** Standings med alla fält (points, played, goal_diff). ISR 3600s. */
export async function fetchStandingsFull(seasonId?: string): Promise<SMStandingRow[]> {
  const sid = seasonId ?? process.env.SPORTSMONKS_ALLSVENSKAN_SEASON_ID;
  if (!sid) return [];
  try {
    const raw = await smFetch<any[]>(
      `/standings/seasons/${sid}`,
      { include: "participant" },
      3600
    );
    return raw
      .map((row, i) => {
        const w = Number(row.won ?? row.wins ?? 0);
        const d = Number(row.draw ?? row.draws ?? 0);
        const l = Number(row.lost ?? row.losses ?? 0);
        const gf = Number(row.goals_scored ?? row.goals?.scored ?? 0);
        const ga = Number(row.goals_against ?? row.goals?.conceded ?? 0);
        const rawForm: string[] = typeof row.form === "string"
          ? row.form.split("").filter((c: string) => ["W", "D", "L"].includes(c))
          : Array.isArray(row.form) ? row.form : [];
        return {
          team: row.participant ?? row.team ?? { id: i, name: "Okänt lag", short_code: null, image_path: "" },
          position: Number(row.position ?? i + 1),
          played: w + d + l,
          wins: w,
          draws: d,
          losses: l,
          goals_for: gf,
          goals_against: ga,
          goal_diff: gf - ga,
          points: Number(row.points ?? w * 3 + d),
          form: rawForm.slice(-5),
        };
      })
      .sort((a, b) => a.position - b.position);
  } catch (e) {
    console.error("Sportsmonks fetchStandingsFull fel", e);
    return [];
  }
}

/** Toppskytt för en säsong. ISR 3600s. */
export async function fetchTopScorers(seasonId?: string): Promise<SMTopScorer[]> {
  const sid = seasonId ?? process.env.SPORTSMONKS_ALLSVENSKAN_SEASON_ID;
  if (!sid) return [];
  try {
    const raw = await smFetch<any[]>(
      `/topscorers/seasons/${sid}`,
      { include: "player;team", per_page: "50" },
      3600
    );
    return raw.map((row, i) => ({
      rank: i + 1,
      player_id: Number(row.player_id ?? row.player?.id ?? 0),
      player_name: String(row.player?.display_name ?? row.player?.name ?? `Spelare ${i + 1}`),
      team_name: String(row.team?.name ?? "Okänt"),
      team_image: String(row.team?.image_path ?? ""),
      goals: Number(row.goals ?? row.total ?? 0),
      penalties: Number(row.penalties ?? 0),
    }));
  } catch (e) {
    console.error("Sportsmonks fetchTopScorers fel", e);
    return [];
  }
}

/** Toppassisters för en säsong. ISR 3600s. */
export async function fetchTopAssists(seasonId?: string): Promise<SMTopAssist[]> {
  const sid = seasonId ?? process.env.SPORTSMONKS_ALLSVENSKAN_SEASON_ID;
  if (!sid) return [];
  try {
    const raw = await smFetch<any[]>(
      `/topassists/seasons/${sid}`,
      { include: "player;team", per_page: "50" },
      3600
    );
    return raw.map((row, i) => ({
      rank: i + 1,
      player_id: Number(row.player_id ?? row.player?.id ?? 0),
      player_name: String(row.player?.display_name ?? row.player?.name ?? `Spelare ${i + 1}`),
      team_name: String(row.team?.name ?? "Okänt"),
      team_image: String(row.team?.image_path ?? ""),
      assists: Number(row.assists ?? row.total ?? 0),
    }));
  } catch (e) {
    console.error("Sportsmonks fetchTopAssists fel", e);
    return [];
  }
}

// ─── Helper: omvandla fixture till visningsvänlig form ────────────────────────
export function parseFixtureScore(fixture: SMFixture) {
  const home = fixture.participants?.find((p) => p.meta.location === "home");
  const away = fixture.participants?.find((p) => p.meta.location === "away");

  const homeGoals =
    fixture.scores?.find((s) => s.score.participant === "home")?.score.goals ??
    null;
  const awayGoals =
    fixture.scores?.find((s) => s.score.participant === "away")?.score.goals ??
    null;

  const liveMinute =
    fixture.periods?.find((p) => p.has_timer)?.minutes ?? null;
  const isLive = fixture.state?.state === "inprogress";

  return { home, away, homeGoals, awayGoals, liveMinute, isLive };
}
