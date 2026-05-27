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
const API_TOKEN = process.env.SPORTSMONKS_API_TOKEN!;

// ─── Fetch-helper med ISR-cache ────────────────────────────────────────────────
async function smFetch<T>(
  path: string,
  params: Record<string, string> = {},
  revalidate = 60
): Promise<T> {
  const url = new URL(`${BASE_URL}${path}`);
  url.searchParams.set("api_token", API_TOKEN);
  for (const [k, v] of Object.entries(params)) {
    url.searchParams.set(k, v);
  }

  const res = await fetch(url.toString(), {
    next: { revalidate },
    headers: { Accept: "application/json" },
  });

  if (!res.ok) {
    throw new Error(
      `Sportsmonks API fel ${res.status}: ${path}`
    );
  }

  const json = await res.json();
  return json.data as T;
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
export async function getLiveFixtures(): Promise<SMFixture[]> {
  return smFetch<SMFixture[]>(
    "/livescores/inplay",
    { include: "participants;scores;state;league;periods" },
    60
  );
}

/**
 * Hämtar dagens matcher (ISR 60s).
 */
export async function getTodayFixtures(): Promise<SMFixture[]> {
  return smFetch<SMFixture[]>(
    "/fixtures/date/today",
    { include: "participants;scores;state;league" },
    60
  );
}

/**
 * Hämta lagprofil med statistik (ISR 3600s).
 */
export async function getTeamById(teamId: number): Promise<SMTeam> {
  return smFetch<SMTeam>(
    `/teams/${teamId}`,
    { include: "players;country" },
    3600
  );
}

/**
 * Hämta stående i en liga (ISR 3600s).
 */
export async function getStandings(seasonId: number): Promise<SMTeamStats[]> {
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
  >(
    `/standings/seasons/${seasonId}`,
    {},
    3600
  );

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
