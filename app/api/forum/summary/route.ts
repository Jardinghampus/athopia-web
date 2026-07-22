import { NextRequest, NextResponse } from "next/server";
import { canAccess } from "@/lib/access-rules";
import { jsonContract } from "@/lib/api-contract";
import { ForumSummaryResponseSchema } from "@/lib/api-schemas";
import { getForumTeamSummary } from "@/lib/forum/summary";
import { getUserPlan } from "@/lib/user-plan";

export const revalidate = 300;

export async function GET(request: NextRequest) {
  const teamSlug = request.nextUrl.searchParams.get("teamSlug")?.trim();
  if (!teamSlug) {
    return NextResponse.json({ error: "teamSlug krävs" }, { status: 400 });
  }

  const summary = await getForumTeamSummary(teamSlug);
  if (!summary) {
    return jsonContract(ForumSummaryResponseSchema, {
      summary: null,
      teaser: null,
      unlocked: false,
      requiredPlan: null,
    });
  }

  const plan = await getUserPlan();
  const unlocked = canAccess("forumSummary", plan);
  const teaser = summary.length > 160 ? `${summary.slice(0, 160).trim()}…` : summary;

  return jsonContract(ForumSummaryResponseSchema, {
    summary: unlocked ? summary : null,
    teaser,
    unlocked,
    requiredPlan: "pro",
  });
}
