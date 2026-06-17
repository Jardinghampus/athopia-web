import { NextResponse } from "next/server";
import { fetchStandingsFull } from "@/lib/db/fixtures";

export const revalidate = 3600;

export async function GET() {
  const rows = await fetchStandingsFull();
  const standings = rows.map((r, i) => ({
    id: String(r.team.id || i),
    position: r.position,
    teamId: r.team.id,
    teamName: r.team.name,
    teamSlug: r.team.name.toLowerCase().replace(/\s+/g, "-"),
    played: r.played,
    won: r.wins,
    drawn: r.draws,
    lost: r.losses,
    goalsFor: r.goals_for,
    goalsAgainst: r.goals_against,
    points: r.points,
  }));

  return NextResponse.json(
    { standings },
    { headers: { "Cache-Control": "public, max-age=3600, stale-while-revalidate=7200" } }
  );
}
