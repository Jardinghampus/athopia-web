import { NextResponse } from "next/server";
import { createServerClient, isSupabaseConfigured } from "@/lib/supabase";

export const revalidate = 3600;

export async function GET() {
  if (!isSupabaseConfigured()) return NextResponse.json({ rows: [] });

  const db = createServerClient();
  const seasonId = Number(process.env.SPORTSMONKS_SEASON_ID_2026 ?? "26806");

  const { data } = await db
    .from("stats_season_projection")
    .select("team_id,current_points,elo,p_champion,p_top3,p_relegation,p_playoff,n_sims,computed_at")
    .eq("sport", "football")
    .eq("season_id", seasonId)
    .order("p_champion", { ascending: false });

  if (!data || data.length === 0) return NextResponse.json({ rows: [] });

  // Hämta team-namn och logotyp från entities
  const teamIds = data.map((r) => r.team_id);
  const { data: entities } = await db
    .from("entities")
    .select("sportmonks_id,name,logo_url")
    .in("sportmonks_id", teamIds)
    .eq("type", "team");

  const entityMap = new Map(
    (entities ?? []).map((e) => [e.sportmonks_id, e])
  );

  const rows = data.map((r) => {
    const ent = entityMap.get(r.team_id);
    return {
      teamId: r.team_id,
      teamName: ent?.name ?? String(r.team_id),
      logoUrl: ent?.logo_url ?? null,
      points: r.current_points,
      elo: r.elo,
      pChampion: r.p_champion,
      pTop3: r.p_top3,
      pRelegation: r.p_relegation,
      pPlayoff: r.p_playoff,
      nSims: r.n_sims,
      computedAt: r.computed_at,
    };
  });

  return NextResponse.json(
    { rows },
    { headers: { "Cache-Control": "public, max-age=3600, stale-while-revalidate=7200" } }
  );
}
