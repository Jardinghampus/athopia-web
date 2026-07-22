import { NextResponse } from "next/server";
import { jsonContract } from "@/lib/api-contract";
import { StatsLeaderboardResponseSchema } from "@/lib/api-schemas";
import {
  getLeaderboardForMetric,
  LEADER_METRICS,
  SEASON_IDS,
  type LeaderMetric,
} from "@/lib/statistik";

export const revalidate = 300;

const METRIC_SET = new Set<string>(LEADER_METRICS);

export async function GET(req: Request) {
  const url = new URL(req.url);
  const metric = url.searchParams.get("metric") ?? "goals";
  const seasonYear = url.searchParams.get("season") ?? "2026";

  if (!METRIC_SET.has(metric)) {
    return NextResponse.json(
      { error: `Invalid metric. Allowed: ${LEADER_METRICS.join(", ")}` },
      { status: 400 }
    );
  }

  if (!(seasonYear in SEASON_IDS)) {
    return NextResponse.json(
      { error: `Invalid season. Allowed: ${Object.keys(SEASON_IDS).join(", ")}` },
      { status: 400 }
    );
  }

  const seasonId = Number(SEASON_IDS[seasonYear]);
  const rows = await getLeaderboardForMetric(metric as LeaderMetric, seasonYear);

  return jsonContract(
    StatsLeaderboardResponseSchema,
    {
      metric,
      seasonId,
      entries: rows.map((r) => ({
        rank: r.rank,
        playerId: r.player_id,
        teamId: r.team_id,
        playerName: r.player_name,
        teamName: r.team_name,
        teamSlug: r.team_slug,
        slug: r.slug,
        image: r.image,
        position: r.position,
        appearances: r.appearances,
        minutes: r.minutes,
        goals: r.goals,
        assists: r.assists,
        shots: r.shots,
        shotsOnTarget: r.shots_on_target,
        keyPasses: r.key_passes,
        passes: r.passes,
        passAccuracy: r.pass_accuracy,
        tackles: r.tackles,
        interceptions: r.interceptions,
        rating: r.rating,
        yellowCards: r.yellow_cards,
        redCards: r.red_cards,
        xg: r.xg ?? null,
        xa: r.xa ?? null,
      })),
    },
    {
      headers: {
        "Cache-Control": "public, max-age=300, stale-while-revalidate=600",
      },
    }
  );
}
