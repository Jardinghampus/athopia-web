/**
 * lib/team-hub/scout.ts — Scout Mode datalager
 * ─────────────────────────────────────────────────────────────────────────────
 * Tänk som en fotbollsscout: filtrera spelare på mätvärden och jämför mot
 * liga- och positionsmedian. All data från Supabase (synkad av athopia-os).
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { createServerClient, isSupabaseConfigured } from "@/lib/supabase";
import { SEASON_2026 } from "./queries";
import type { ScoutPlayer } from "./scout-metrics";

// Klientsäkra delar bor i scout-metrics.ts (se den filens rubrik).
export { SCOUT_METRICS, median } from "./scout-metrics";
export type { ScoutPlayer, ScoutMetricKey } from "./scout-metrics";

export async function getScoutPool(): Promise<ScoutPlayer[]> {
  // CRITICAL: never return mock/demo data on public surfaces.
  if (!isSupabaseConfigured()) return [];
  try {
    const db = createServerClient();
    const [{ data: stats }, { data: teams }] = await Promise.all([
      db.from("player_season_stats")
        .select("player_id,team_id,appearances,minutes,goals,assists,xg,xa,shots,shots_on_target,key_passes,passes,pass_accuracy,tackles,interceptions,rating,yellow_cards,red_cards")
        .eq("season_id", SEASON_2026),
      db.from("entities").select("name,metadata").eq("type", "team"),
    ]);

    const teamName = new Map<number, string>();
    for (const t of (teams ?? []) as Record<string, unknown>[]) {
      const meta = (t.metadata ?? {}) as Record<string, unknown>;
      const smId = meta.sportsmonks_id as number | undefined;
      if (smId != null) teamName.set(smId, String(t.name));
    }

    const rows = (stats ?? []) as Record<string, unknown>[];
    const playerIds = rows.map((r) => Number(r.player_id)).filter(Boolean);
    const { data: players } = playerIds.length
      ? await db.from("players").select("sportmonks_id,fullname,position,slug").in("sportmonks_id", playerIds)
      : { data: [] };
    const playerById = new Map(
      ((players ?? []) as Record<string, unknown>[]).map((p) => [Number(p.sportmonks_id), p])
    );

    const pool = rows.map((r) => {
      const playerId = Number(r.player_id ?? 0);
      const p = playerById.get(playerId);
      const tid = Number(r.team_id ?? 0);
      return {
        player_id: playerId,
        fullname: (p?.fullname as string) ?? `Spelare ${playerId}`,
        slug: (p?.slug as string | null) ?? null,
        position: (p?.position as string | null) ?? null,
        team_id: tid,
        team_name: teamName.get(tid) ?? "Okänt lag",
        appearances: Number(r.appearances ?? 0),
        minutes: Number(r.minutes ?? 0),
        goals: Number(r.goals ?? 0),
        assists: Number(r.assists ?? 0),
        xg: Number(r.xg ?? 0),
        xa: Number(r.xa ?? 0),
        shots: Number(r.shots ?? 0),
        shots_on_target: Number(r.shots_on_target ?? 0),
        key_passes: Number(r.key_passes ?? 0),
        passes: Number(r.passes ?? 0),
        pass_accuracy: Number(r.pass_accuracy ?? 0),
        tackles: Number(r.tackles ?? 0),
        interceptions: Number(r.interceptions ?? 0),
        rating: Number(r.rating ?? 0),
        yellow_cards: Number(r.yellow_cards ?? 0),
        red_cards: Number(r.red_cards ?? 0),
      };
    });
    return pool;
  } catch {
    return [];
  }
}
