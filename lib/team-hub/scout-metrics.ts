/**
 * lib/team-hub/scout-metrics.ts — klientsäker del av Scout Mode
 * ─────────────────────────────────────────────────────────────────────────────
 * Ren data och typer, inga beroenden. Ligger i egen fil för att
 * PlayerCompareClient (en klientkomponent) behöver SCOUT_METRICS men INTE
 * datalagret: `scout.ts` importerar `lib/supabase.ts`, och den importen drog in
 * hela service-role-fabriken i klientbundlen. Se säkerhetsauditen 2026-08-06.
 * ─────────────────────────────────────────────────────────────────────────────
 */

export interface ScoutPlayer {
  player_id: number;
  fullname: string;
  slug: string | null;
  position: string | null;
  team_id: number;
  team_name: string;
  appearances: number;
  minutes: number;
  goals: number;
  assists: number;
  shots: number;
  shots_on_target: number;
  key_passes: number;
  passes: number;
  pass_accuracy: number;
  tackles: number;
  interceptions: number;
  rating: number;
  xg: number;
  xa: number;
  yellow_cards: number;
  red_cards: number;
}

export const SCOUT_METRICS = [
  { key: "goals", label: "Mål" },
  { key: "assists", label: "Assist" },
  { key: "xg", label: "xG" },
  { key: "xa", label: "xA" },
  { key: "shots", label: "Skott" },
  { key: "shots_on_target", label: "Skott på mål" },
  { key: "key_passes", label: "Nyckelpass" },
  { key: "passes", label: "Passningar" },
  { key: "pass_accuracy", label: "Pass%" },
  { key: "tackles", label: "Tacklingar" },
  { key: "interceptions", label: "Brytningar" },
  { key: "minutes", label: "Speltid" },
  { key: "rating", label: "Betyg" },
  { key: "yellow_cards", label: "Gula kort" },
  { key: "red_cards", label: "Röda kort" },
] as const;

export type ScoutMetricKey = (typeof SCOUT_METRICS)[number]["key"];

/** Median över ett numeriskt fält — ren funktion, används på båda sidor. */
export function median(values: number[]): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0 ? (sorted[mid - 1]! + sorted[mid]!) / 2 : sorted[mid]!;
}
