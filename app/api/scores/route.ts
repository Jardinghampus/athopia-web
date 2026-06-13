import { NextResponse } from "next/server";
import { fetchLiveScores, fetchAllsvenskanFixtures, parseFixtureScore } from "@/lib/db/fixtures";

export const revalidate = 60;

export async function GET() {
  const fixtures = (await fetchLiveScores()).length > 0 ? await fetchLiveScores() : await fetchAllsvenskanFixtures();
  const normalized = fixtures.slice(0, 12).map((f) => {
    const { home, away, homeGoals, awayGoals, liveMinute, isLive } = parseFixtureScore(f);
    return {
      id: f.id,
      startingAt: f.starting_at,
      status: isLive ? "LIVE" : f.state?.short_name ?? f.state?.state ?? "NS",
      minute: liveMinute,
      home: { id: home?.id ?? 0, name: home?.name ?? "?", slug: (home?.name ?? "").toLowerCase().replace(/\s+/g, "-"), logoUrl: home?.image_path ?? null },
      away: { id: away?.id ?? 0, name: away?.name ?? "?", slug: (away?.name ?? "").toLowerCase().replace(/\s+/g, "-"), logoUrl: away?.image_path ?? null },
      scoreHome: homeGoals,
      scoreAway: awayGoals,
    };
  });
  return NextResponse.json(normalized, {
    headers: {
      "Cache-Control": "public, max-age=60, stale-while-revalidate=300",
    },
  });
}

