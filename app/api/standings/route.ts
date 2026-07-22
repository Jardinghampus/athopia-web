import { NextResponse } from "next/server";
import { fetchStandingsFull } from "@/lib/db/fixtures";
import { jsonContract } from "@/lib/api-contract";
import { StandingsResponseSchema } from "@/lib/api-schemas";

export const revalidate = 300;

export async function GET() {
  const rows = await fetchStandingsFull();
  const standings = rows.map((r, i) => ({
    id: String(r.team.id || i),
    position: r.position,
    teamId: r.team.id,
    teamName: r.team.name,
    teamSlug: r.team.slug,
    played: r.played,
    won: r.wins,
    drawn: r.draws,
    lost: r.losses,
    goalsFor: r.goals_for,
    goalsAgainst: r.goals_against,
    points: r.points,
    form: r.form,
    trend: r.trend,
  }));

  return jsonContract(StandingsResponseSchema,
    { standings },
    { headers: { "Cache-Control": "public, max-age=300, stale-while-revalidate=600" } }
  );
}
