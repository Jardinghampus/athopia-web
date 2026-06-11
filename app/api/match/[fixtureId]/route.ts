import { NextRequest, NextResponse } from "next/server";
import { createServerClient, isSupabaseConfigured } from "@/lib/supabase";

export const revalidate = 0;

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ fixtureId: string }> },
) {
  const { fixtureId } = await params;
  const id = parseInt(fixtureId, 10);
  if (isNaN(id)) return NextResponse.json(null, { status: 400 });
  if (!isSupabaseConfigured()) return NextResponse.json(null, { status: 503 });

  const db = createServerClient();
  const [{ data: fix }, { data: tms }] = await Promise.all([
    db.from("fixtures").select("home_team_name,away_team_name,home_score,away_score,kickoff_at,status").eq("sportmonks_id", id).maybeSingle(),
    db.from("team_match_stats").select("team_id,possession,shots,shots_on_target,xg").eq("fixture_id", id),
  ]);

  if (!fix) return NextResponse.json(null, { status: 404 });

  const stats = (tms ?? []) as { team_id: number; possession: number; shots: number; shots_on_target: number; xg: number }[];
  const [s1, s2] = stats;

  return NextResponse.json(
    { ...fix, home_xg: s1?.xg ?? null, away_xg: s2?.xg ?? null, home_possession: s1?.possession ?? null, away_possession: s2?.possession ?? null, home_shots: s1?.shots ?? null, away_shots: s2?.shots ?? null, home_shots_on_target: s1?.shots_on_target ?? null, away_shots_on_target: s2?.shots_on_target ?? null },
    { headers: { "Cache-Control": "no-store" } },
  );
}
