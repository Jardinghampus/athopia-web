/**
 * lib/team-hub/scout.ts — Scout Mode datalager
 * ─────────────────────────────────────────────────────────────────────────────
 * Tänk som en fotbollsscout: filtrera spelare på mätvärden och jämför mot
 * liga- och positionsmedian. All data från Supabase (synkad av athopia-os).
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { createServerClient, isSupabaseConfigured } from "@/lib/supabase";
import { SEASON_2026 } from "./queries";

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
  xg: number;
  xa: number;
  rating: number;
}

export const SCOUT_METRICS = [
  { key: "goals", label: "Mål" },
  { key: "assists", label: "Assist" },
  { key: "xg", label: "xG" },
  { key: "xa", label: "xA" },
  { key: "shots", label: "Skott" },
  { key: "minutes", label: "Speltid" },
  { key: "rating", label: "Betyg" },
] as const;

export type ScoutMetricKey = (typeof SCOUT_METRICS)[number]["key"];

export async function getScoutPool(): Promise<ScoutPlayer[]> {
  const { mockScoutPool } = await import("./mock");
  if (!isSupabaseConfigured()) return mockScoutPool();
  try {
    const db = createServerClient();
    const [{ data: stats }, { data: teams }] = await Promise.all([
      db.from("player_season_stats")
        .select("team_id,appearances,minutes,goals,assists,shots,xg,xa,rating,players(sportmonks_id,fullname,position,slug)")
        .eq("season_id", SEASON_2026),
      db.from("entities").select("name,metadata").eq("type", "team"),
    ]);

    const teamName = new Map<number, string>();
    for (const t of (teams ?? []) as Record<string, unknown>[]) {
      const meta = (t.metadata ?? {}) as Record<string, unknown>;
      const smId = meta.sportsmonks_id as number | undefined;
      if (smId != null) teamName.set(smId, String(t.name));
    }

    const pool = ((stats ?? []) as Record<string, unknown>[]).map((r) => {
      const p = (r.players ?? {}) as Record<string, unknown>;
      const tid = Number(r.team_id ?? 0);
      return {
        player_id: (p.sportmonks_id as number) ?? 0,
        fullname: (p.fullname as string) ?? "–",
        slug: (p.slug as string | null) ?? null,
        position: (p.position as string | null) ?? null,
        team_id: tid,
        team_name: teamName.get(tid) ?? "Okänt lag",
        appearances: Number(r.appearances ?? 0),
        minutes: Number(r.minutes ?? 0),
        goals: Number(r.goals ?? 0),
        assists: Number(r.assists ?? 0),
        shots: Number(r.shots ?? 0),
        xg: Number(r.xg ?? 0),
        xa: Number(r.xa ?? 0),
        rating: Number(r.rating ?? 0),
      };
    });
    // Fallback till mock medan DB är tom/onåbar så UI:t går att jobba med.
    return pool.length > 0 ? pool : mockScoutPool();
  } catch {
    return mockScoutPool();
  }
}

export function median(values: number[]): number {
  if (values.length === 0) return 0;
  const s = [...values].sort((a, b) => a - b);
  const mid = Math.floor(s.length / 2);
  return s.length % 2 ? s[mid] : (s[mid - 1] + s[mid]) / 2;
}
