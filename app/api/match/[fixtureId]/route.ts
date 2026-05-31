import { NextRequest, NextResponse } from "next/server";
import { createServerClient, isSupabaseConfigured } from "@/lib/supabase";

export const revalidate = 0;

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ fixtureId: string }> },
) {
  const { fixtureId } = await params;
  const id = parseInt(fixtureId, 10);

  if (isNaN(id)) {
    return NextResponse.json(null, { status: 400 });
  }

  if (!isSupabaseConfigured()) {
    return NextResponse.json(null, { status: 503 });
  }

  const db = createServerClient();
  const { data, error } = await db
    .from("match_stats")
    .select(
      "home_team_name, away_team_name, home_score, away_score, home_xg, away_xg, home_possession, away_possession, home_shots, away_shots, home_shots_on_target, away_shots_on_target, played_at, milo_analyzed",
    )
    .eq("fixture_id", id)
    .single();

  if (error || !data) {
    return NextResponse.json(null, { status: 404 });
  }

  return NextResponse.json(data, {
    headers: { "Cache-Control": "no-store" },
  });
}
