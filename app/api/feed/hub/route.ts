import { NextResponse } from "next/server";
import { getTeamHub } from "@/lib/team-hub/queries";
import { getPodcasts } from "@/lib/supabase";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const team = searchParams.get("team");

  if (!team) {
    return NextResponse.json({ error: "team required" }, { status: 400 });
  }

  const [hub, podcasts] = await Promise.all([
    getTeamHub(team),
    getPodcasts(6),
  ]);

  if (!hub) {
    return NextResponse.json({ error: "Team not found" }, { status: 404 });
  }

  return NextResponse.json({
    ...hub,
    podcasts: podcasts.map((p) => ({
      id: p.id,
      show_name: p.showName,
      title: p.title,
      duration_seconds: p.durationSeconds,
      published_at: p.publishedAt,
    })),
  });
}
