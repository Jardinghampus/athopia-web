import { NextRequest, NextResponse } from "next/server";
import { canAccess, requiredPlanFor } from "@/lib/access-rules";
import {
  getPostMatchAnalyses,
  getPostMatchAnalysis,
} from "@/lib/supabase";
import { getUserPlan } from "@/lib/user-plan";
import { jsonContract } from "@/lib/api-contract";
import { AnalysisListResponseSchema, AnalysisDetailResponseSchema } from "@/lib/api-schemas";

export const dynamic = "force-dynamic";

function listItem(analysis: Awaited<ReturnType<typeof getPostMatchAnalyses>>[number]) {
  return {
    id: analysis.id,
    title: analysis.title,
    summary: analysis.summary,
    publishedAt: analysis.publishedAt,
    fixtureId: analysis.fixtureId,
    matchName: analysis.matchName,
    playedAt: analysis.playedAt,
  };
}

export async function GET(request: NextRequest) {
  const id = request.nextUrl.searchParams.get("id");
  if (!id) {
    const analyses = await getPostMatchAnalyses(30);
    return jsonContract(AnalysisListResponseSchema, { analyses: analyses.map(listItem) });
  }

  const analysis = await getPostMatchAnalysis(id);
  if (!analysis) {
    return NextResponse.json(
      { error: "Matchanalys hittades inte", code: "not_found" },
      { status: 404 },
    );
  }

  const plan = await getUserPlan();
  const unlocked = canAccess("aiSummaries", plan);
  return jsonContract(AnalysisDetailResponseSchema, {
    analysis: {
      ...listItem(analysis),
      body: unlocked ? analysis.body : null,
      bodyPreview: analysis.body
        ? `${analysis.body.slice(0, 160)}${analysis.body.length > 160 ? "…" : ""}`
        : null,
      comparisons: unlocked ? analysis.comparisons : [],
      hasProtectedContent:
        Boolean(analysis.body) || analysis.comparisons.length > 0,
    },
    access: {
      feature: "aiSummaries",
      unlocked,
      requiredPlan: requiredPlanFor("aiSummaries"),
      upgradePath: "/prenumerera",
    },
  });
}
