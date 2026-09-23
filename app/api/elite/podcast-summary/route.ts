/**
 * GET /api/elite/podcast-summary — läser Nano Fotbolls originalsammanfattning.
 *
 * Endast läsning. Sammanfattningen skrivs av athopia-os (podcast-processor +
 * scripts/backfill-podcast-summaries.ts) till metadata.athopia_summary.
 * LLM-nycklar finns bara i os, aldrig i web (founderbeslut 2026-09-17) — den
 * tidigare POST-routen kunde därför aldrig generera något i produktion.
 */
import { getUserPlan } from "@/lib/user-plan";
import { canAccess } from "@/lib/access-rules";
import { jsonContract } from "@/lib/api-contract";
import { PodcastSummaryResponseSchema } from "@/lib/api-schemas";
import { parseQuery, z } from "@/lib/validation";
import { enforceRateLimit } from "@/lib/ratelimit";
import { loadPodcastEpisode } from "@/lib/ai/podcast-context";
import { summaryTeaser } from "@/lib/podcast/summary";

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
