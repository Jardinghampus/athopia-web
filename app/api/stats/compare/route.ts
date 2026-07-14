import { NextRequest, NextResponse } from "next/server";
import {
  getTeamCompareAnalysis,
  getTeamCompareStats,
} from "@/lib/statistik/team-compare";

export const revalidate = 3600;

export async function GET(request: NextRequest) {
  const teamASlug = request.nextUrl.searchParams.get("teamA")?.trim();
  const teamBSlug = request.nextUrl.searchParams.get("teamB")?.trim();

  if (!teamASlug || !teamBSlug) {
    return NextResponse.json(
      { error: "teamA och teamB krävs som slug-parametrar." },
      { status: 400 },
    );
  }
  if (teamASlug === teamBSlug) {
    return NextResponse.json({ error: "Välj två olika lag." }, { status: 400 });
  }

  const [teamA, teamB, analysis] = await Promise.all([
    getTeamCompareStats(teamASlug),
    getTeamCompareStats(teamBSlug),
    getTeamCompareAnalysis(teamASlug, teamBSlug),
  ]);

  if (!teamA || !teamB) {
    return NextResponse.json({ error: "Lag hittades inte." }, { status: 404 });
  }

  return NextResponse.json(
    { teamA, teamB, analysis },
    { headers: { "Cache-Control": "public, max-age=3600, stale-while-revalidate=7200" } },
  );
}
