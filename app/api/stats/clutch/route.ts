import { NextResponse } from "next/server";
import { createServerClient, isSupabaseConfigured } from "@/lib/supabase";

export const revalidate = 3600;

export async function GET() {
  if (!isSupabaseConfigured()) return NextResponse.json({ rows: [] });

  const db = createServerClient();
  const seasonId = Number(process.env.SPORTSMONKS_SEASON_ID_2026 ?? "26806");

  const { data } = await db
    .from("stats_clutch")
    .select("player_id,goals,clutch_score,trailing_goals,level_goals,leading_goals,computed_at")
    .eq("sport", "football")
    .eq("season_id", seasonId)
    .order("clutch_score", { ascending: false })
    .limit(25);

  if (!data || data.length === 0) return NextResponse.json({ rows: [] });

  // Hämta spelarnamn via player_season_stats
  const playerIds = data.map((r) => r.player_id);
  const { data: players } = await db
    .from("player_season_stats")
    .select("sportsmonks_player_id,player_name,team_name,image_path")
    .in("sportsmonks_player_id", playerIds)
    .eq("season_id", seasonId);

  const playerMap = new Map(
    (players ?? []).map((p) => [p.sportsmonks_player_id, p])
  );

  const rows = data.map((r, i) => {
    const p = playerMap.get(r.player_id);
    return {
      rank: i + 1,
      playerId: r.player_id,
      playerName: p?.player_name ?? String(r.player_id),
      teamName: p?.team_name ?? "",
      image: p?.image_path ?? null,
      goals: r.goals,
      clutchScore: r.clutch_score,
      trailingGoals: r.trailing_goals,
      levelGoals: r.level_goals,
      leadingGoals: r.leading_goals,
    };
  });

  return NextResponse.json(
    { rows },
    { headers: { "Cache-Control": "public, max-age=3600, stale-while-revalidate=7200" } }
  );
}
