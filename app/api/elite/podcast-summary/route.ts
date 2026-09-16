import { auth } from "@clerk/nextjs/server";
import { getUserPlan } from "@/lib/user-plan";
import { canAccess, requiredPlanFor } from "@/lib/access-rules";
import { jsonContract } from "@/lib/api-contract";
import { PodcastSummaryResponseSchema } from "@/lib/api-schemas";
import { parseBody, parseQuery, z } from "@/lib/validation";
import { enforceRateLimit } from "@/lib/ratelimit";
import {
  generateEpisodeSummaryWithUsage,
  loadPodcastEpisode,
} from "@/lib/ai/podcast-context";
import { addChatTokens, checkMonthlyAiBudget, getChatDb } from "@/lib/ai/chat-limits";
import { summaryTeaser } from "@/lib/podcast/summary";

export const maxDuration = 30;

const QuerySchema = z.object({
  episodeId: z.string().uuid(),
});

export async function GET(req: Request) {
  const blocked = await enforceRateLimit("read", req);
  if (blocked) return blocked;

  const parsed = parseQuery(req, QuerySchema);
  if (!parsed.ok) return parsed.response;

  const episode = await loadPodcastEpisode(parsed.data.episodeId);
  if (!episode) {
    return Response.json({ error: "Avsnittet hittades inte." }, { status: 404 });
  }

  const plan = await getUserPlan();
  const unlocked = canAccess("podcastAiChat", plan);
  const summary = episode.summary;

  return jsonContract(PodcastSummaryResponseSchema, {
    headline: unlocked ? (summary?.headline ?? null) : null,
    bullets: unlocked ? (summary?.bullets ?? []) : [],
    teaser: summary ? summaryTeaser(summary) : null,
    unlocked,
    hasSource: episode.hasSource,
    requiredPlan: "pro",
  });
}

export async function POST(req: Request) {
  const { userId } = await auth();
  if (!userId) return new Response("Unauthorized", { status: 401 });

  const blocked = await enforceRateLimit("ai", req, userId);
  if (blocked) return blocked;

  const plan = await getUserPlan();
  if (!canAccess("podcastAiChat", plan)) {
    const requiredPlan = requiredPlanFor("podcastAiChat");
    return Response.json(
      {
        error: `${requiredPlan === "elite" ? "Elite" : "PRO"}-prenumeration krävs för poddsammanfattningen.`,
        code: "plan_required",
        feature: "podcastAiChat",
        requiredPlan,
        upgradePath: "/prenumerera",
      },
      { status: 403 },
    );
  }

  const parsed = await parseBody(req, QuerySchema);
  if (!parsed.ok) return parsed.response;

  const episode = await loadPodcastEpisode(parsed.data.episodeId);
  if (!episode) {
    return Response.json({ error: "Avsnittet hittades inte." }, { status: 404 });
  }
  if (!episode.hasSource) {
    return Response.json(
      { error: "Avsnittet är inte transkriberat ännu." },
      { status: 409 },
    );
  }

  const db = getChatDb();
  if (!episode.summary) {
    const budget = await checkMonthlyAiBudget(db);
    if (!budget.ok) {
      return Response.json({ error: budget.error }, { status: budget.status });
    }
  }

  const generated = await generateEpisodeSummaryWithUsage(parsed.data.episodeId);
  await addChatTokens(db, userId, generated.tokensIn, generated.tokensOut);
  if (!generated.summary) {
    return Response.json({ error: "Sammanfattningen kunde inte skapas." }, { status: 502 });
  }

  return jsonContract(PodcastSummaryResponseSchema, {
    headline: generated.summary.headline,
    bullets: generated.summary.bullets,
    teaser: summaryTeaser(generated.summary),
    unlocked: true,
    hasSource: episode.hasSource,
    requiredPlan: "pro",
  });
}
