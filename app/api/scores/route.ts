import { fetchLiveScores, fetchAllsvenskanFixtures, parseFixtureScore } from "@/lib/db/fixtures";
import { jsonContract } from "@/lib/api-contract";
import { ScoresResponseSchema } from "@/lib/api-schemas";

export const revalidate = 60;

export async function GET() {
  const live = await fetchLiveScores();
  let fixtures = live;
  if (live.length === 0) {
    const all = await fetchAllsvenskanFixtures();
    const now = Date.now();
    const upcoming = all.filter((f) => new Date(f.starting_at).getTime() >= now);
    if (upcoming.length > 0) {
      fixtures = upcoming; // redan sorterade stigande (närmast matchdag först)
    } else {
      fixtures = [...all].sort((a, b) => new Date(b.starting_at).getTime() - new Date(a.starting_at).getTime());
    }
  }
  const normalized = fixtures.slice(0, 12).map((f) => {
    const { home, away, homeGoals, awayGoals, liveMinute, isLive } = parseFixtureScore(f);
    return {
      id: f.id,
      startingAt: f.starting_at,
      status: isLive ? "LIVE" : f.state?.short_name ?? f.state?.state ?? "NS",
      minute: liveMinute,
      home: { id: home?.id ?? 0, name: home?.name ?? "?", slug: home?.slug ?? null, logoUrl: home?.image_path ?? null },
      away: { id: away?.id ?? 0, name: away?.name ?? "?", slug: away?.slug ?? null, logoUrl: away?.image_path ?? null },
      scoreHome: homeGoals,
      scoreAway: awayGoals,
    };
  });
  return jsonContract(ScoresResponseSchema, normalized, {
    headers: {
      "Cache-Control": "public, max-age=60, stale-while-revalidate=300",
    },
  });
}

