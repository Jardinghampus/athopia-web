import { NextRequest, NextResponse } from "next/server";
import { canAccess, requiredPlanFor } from "@/lib/access-rules";
import { getDailyEpisodeForShareCached } from "@/lib/team-hub/queries";
import { getUserPlan } from "@/lib/user-plan";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const teamSlug = request.nextUrl.searchParams.get("team");
  const [episode, plan] = await Promise.all([
    getDailyEpisodeForShareCached(teamSlug),
    getUserPlan(),
  ]);
  const unlocked = canAccess("briefAudio", plan);

  return NextResponse.json({
    episode,
    access: {
      feature: "briefAudio",
      unlocked,
      requiredPlan: requiredPlanFor("briefAudio"),
      upgradePath: "/prenumerera",
    },
  });
}
