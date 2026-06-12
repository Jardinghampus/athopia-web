/**
 * lib/team-hub/mock.ts — Mock-data för UI-arbete
 * ─────────────────────────────────────────────────────────────────────────────
 * Aktiveras via dedikerade slugs så riktig data aldrig påverkas:
 *   Lag:     /mitt-lag (välj "DEMO IF") · /lag/demo-if · /api/team/demo-if/hub
 *   Spelare: /spelare/demo-spelare
 * Scout/jämförelse faller tillbaka på mock-poolen när DB är tom/onåbar.
 * ─────────────────────────────────────────────────────────────────────────────
 */

import type { TeamHubPayload, LeaderRow, FixtureRow, TeamSeasonRow } from "./queries";
import type { ScoutPlayer } from "./scout";

export const MOCK_TEAM_SLUG = "demo-if";
export const MOCK_TEAM_SM_ID = 990001;
export const MOCK_PLAYER_SLUG = "demo-spelare";
export const MOCK_PLAYER_SM_ID = 991001;

export const MOCK_TEAM_LIST_ITEM = { name: "Demo IF", slug: MOCK_TEAM_SLUG, logo_url: null as string | null };

const NAMES = [
  "Liam Karlsson", "Noah Eriksson", "Elias Berg", "Hugo Lindqvist", "Oscar Sandström",
  "William Holm", "Lucas Nyström", "Adam Falk", "Theo Ahlgren", "Filip Dahl",
  "Emil Strand", "Viktor Lund", "Nils Hagström", "Anton Sjöberg", "Gustav Ek",
  "Melker Åberg", "Isak Norén", "Vincent Palm", "Albin Roos", "Leo Sundqvist",
  "Demo Spelare", "Ali Demir", "Samuel Okoye", "Mateo Ruiz",
];

const TEAMS = ["Demo IF", "Norrby United", "Västra BK", "Storåns IF", "Lundby FF", "Kuststadens SK"];
const POSITIONS = ["attacker", "midfielder", "defender", "goalkeeper"] as const;

function rnd(seed: number, min: number, max: number) {
  const x = Math.sin(seed * 99.13) * 10000;
  return min + (x - Math.floor(x)) * (max - min);
}

// ── Lag-hub ───────────────────────────────────────────────────────────────────

const mockStats: TeamSeasonRow = {
  team_id: MOCK_TEAM_SM_ID,
  played: 12, wins: 7, draws: 3, losses: 2,
  goals_for: 26, goals_against: 13, goal_diff: 13, points: 24,
  position: 2, xg: 22.4, xga: 12.8, possession: 57,
};

const mockLeaders: LeaderRow[] = [
  { player_id: MOCK_PLAYER_SM_ID, fullname: "Demo Spelare", slug: MOCK_PLAYER_SLUG, image: null, position: "attacker", goals: 9, assists: 4, appearances: 12 },
  { player_id: 991002, fullname: "Liam Karlsson", slug: null, image: null, position: "midfielder", goals: 5, assists: 7, appearances: 12 },
  { player_id: 991003, fullname: "Noah Eriksson", slug: null, image: null, position: "attacker", goals: 6, assists: 2, appearances: 11 },
  { player_id: 991004, fullname: "Elias Berg", slug: null, image: null, position: "midfielder", goals: 3, assists: 5, appearances: 12 },
  { player_id: 991005, fullname: "Hugo Lindqvist", slug: null, image: null, position: "defender", goals: 2, assists: 1, appearances: 12 },
];

function mockFixture(i: number, played: boolean): FixtureRow {
  const opp = TEAMS[(i % (TEAMS.length - 1)) + 1];
  const home = i % 2 === 0;
  const hs = played ? Math.round(rnd(i + 1, 0, 3)) : null;
  const as = played ? Math.round(rnd(i + 7, 0, 3)) : null;
  const day = new Date();
  day.setDate(day.getDate() + (played ? -(i + 1) * 7 : (i + 1) * 7));
  return {
    sportmonks_id: 992000 + i,
    home_team_id: home ? MOCK_TEAM_SM_ID : 993000 + i,
    away_team_id: home ? 993000 + i : MOCK_TEAM_SM_ID,
    home_team_name: home ? "Demo IF" : opp,
    away_team_name: home ? opp : "Demo IF",
    home_score: hs, away_score: as,
    kickoff_at: day.toISOString(),
    status: played ? "FT" : "NS",
  };
}

export function mockTeamHub(): TeamHubPayload {
  const recent = [0, 1, 2, 3, 4].map((i) => mockFixture(i, true));
  const upcoming = [0, 1, 2].map((i) => mockFixture(i, false));
  return {
    team: { id: "mock-team", name: "Demo IF", slug: MOCK_TEAM_SLUG, logo_url: null, sportsmonks_id: MOCK_TEAM_SM_ID },
    position: 2,
    stats: mockStats,
    form: ["W", "W", "D", "L", "W"],
    radar: [
      { metric: "Anfall", value: 78, raw: 26 },
      { metric: "Försvar", value: 71, raw: 13 },
      { metric: "Poäng", value: 82, raw: 24 },
      { metric: "xG", value: 75, raw: 22.4 },
      { metric: "Boll%", value: 68, raw: 57 },
      { metric: "Målskillnad", value: 80, raw: 13 },
    ],
    topScorers: [...mockLeaders].sort((a, b) => b.goals - a.goals).slice(0, 5),
    topAssists: [...mockLeaders].sort((a, b) => b.assists - a.assists).slice(0, 5),
    squad: mockLeaders,
    recent,
    upcoming,
    news: [
      { id: "n1", title: "Demo IF vände underläge till seger i toppmötet", slug: "demo-if-toppmote", summary: "Två sena mål avgjorde.", image_url: null, published_at: new Date(Date.now() - 3600e3).toISOString() },
      { id: "n2", title: "Analys: så blev pressspelet nyckeln", slug: "demo-if-press", summary: "Höga återvinningar gav läge på läge.", image_url: null, published_at: new Date(Date.now() - 8 * 3600e3).toISOString() },
      { id: "n3", title: "Demo Spelare i storform inför derbyt", slug: "demo-spelare-form", summary: "Nio mål på tolv matcher.", image_url: null, published_at: new Date(Date.now() - 26 * 3600e3).toISOString() },
      { id: "n4", title: "Skadebesked: mittbacken tillbaka i truppen", slug: "demo-if-skada", summary: "Klar för spel igen.", image_url: null, published_at: new Date(Date.now() - 50 * 3600e3).toISOString() },
    ],
    threads: [
      { id: "t1", title: "Matchtråd: Demo IF – Norrby United", reply_count: 142, view_count: 2100, created_at: new Date().toISOString() },
      { id: "t2", title: "Vad gör vi med vänsterbacken?", reply_count: 56, view_count: 870, created_at: new Date().toISOString() },
      { id: "t3", title: "Demo Spelare till utlandet i sommar?", reply_count: 88, view_count: 1500, created_at: new Date().toISOString() },
      { id: "t4", title: "Tabelltips inför slutspurten", reply_count: 31, view_count: 540, created_at: new Date().toISOString() },
      { id: "t5", title: "Bästa formationen 4-3-3 eller 3-5-2?", reply_count: 47, view_count: 690, created_at: new Date().toISOString() },
      { id: "t6", title: "Bortaresor — vem kör till Lundby?", reply_count: 19, view_count: 230, created_at: new Date().toISOString() },
    ],
  };
}

// ── Scout-pool (liga) ─────────────────────────────────────────────────────────

export function mockScoutPool(): ScoutPlayer[] {
  return NAMES.map((name, i) => {
    const pos = POSITIONS[i % POSITIONS.length];
    const isDemo = name === "Demo Spelare";
    const attack = pos === "attacker" ? 1 : pos === "midfielder" ? 0.6 : 0.2;
    const minutes = Math.round(rnd(i + 3, 300, 1080));
    return {
      player_id: isDemo ? MOCK_PLAYER_SM_ID : 991100 + i,
      fullname: name,
      slug: isDemo ? MOCK_PLAYER_SLUG : null,
      position: pos,
      team_id: MOCK_TEAM_SM_ID + (i % 6),
      team_name: TEAMS[i % TEAMS.length],
      appearances: Math.round(minutes / 90),
      minutes,
      goals: Math.round(rnd(i + 11, 0, 11) * attack),
      assists: Math.round(rnd(i + 17, 0, 8) * (attack + 0.2)),
      shots: Math.round(rnd(i + 23, 4, 45) * attack + 4),
      xg: Number((rnd(i + 31, 0, 9) * attack).toFixed(2)),
      xa: Number((rnd(i + 41, 0, 6) * (attack + 0.2)).toFixed(2)),
      rating: Number(rnd(i + 53, 6.4, 7.9).toFixed(2)),
    };
  });
}

// ── Spelarsida ────────────────────────────────────────────────────────────────

export function mockPlayer(): Record<string, unknown> {
  return {
    sportmonks_id: MOCK_PLAYER_SM_ID,
    slug: MOCK_PLAYER_SLUG,
    fullname: "Demo Spelare",
    position: "attacker",
    image: null,
    birthdate: "2001-04-12",
    height: 183,
    weight: 76,
  };
}

export function mockPlayerSeason(): Record<string, unknown> {
  return {
    appearances: 12, goals: 9, assists: 4, minutes: 1024,
    xg: 8.6, xa: 3.9, shots: 38, shots_on_target: 19,
    yellow_cards: 2, red_cards: 0,
    passes: 312, tackles: 14, interceptions: 9, dribbles: 41,
  };
}

export function mockPlayerMatches(): Record<string, unknown>[] {
  return [0, 1, 2, 3, 4, 5, 6, 7].map((i) => {
    const f = mockFixture(i, true);
    return {
      fixture_id: f.sportmonks_id,
      minutes_played: Math.round(rnd(i + 61, 60, 90)),
      goals: Math.round(rnd(i + 71, 0, 2)),
      assists: Math.round(rnd(i + 81, 0, 1)),
      yellow_cards: rnd(i + 91, 0, 1) > 0.8 ? 1 : 0,
      red_cards: 0,
      rating: Number(rnd(i + 101, 6.3, 8.4).toFixed(2)),
      xg: Number(rnd(i + 111, 0, 1.4).toFixed(2)),
      fixture: {
        sportmonks_id: f.sportmonks_id,
        home_team_name: f.home_team_name,
        away_team_name: f.away_team_name,
        home_score: f.home_score,
        away_score: f.away_score,
        kickoff_at: f.kickoff_at,
      },
    };
  });
}
