import type { Tool } from "ai";
import { z } from "zod";
import { formatTimestamp } from "@/lib/podcast/summary";
import { loadPodcastEpisode, searchEpisodeChunks } from "./podcast-context";

export function podcastChatTools(episodeId: string): Record<string, Tool> {
  return {
    getEpisodeSummary: {
      description:
        "Hämta Nano Fotbolls sammanfattning av just detta avsnitt. Använd först vid öppna frågor som 'vad handlade det om'.",
      inputSchema: z.object({}),
      execute: async () => {
        const episode = await loadPodcastEpisode(episodeId);
        if (!episode) return { error: "Avsnittet hittades inte." };
        return {
          title: episode.title,
          showName: episode.showName,
          publishedAt: episode.publishedAt,
          mentionedTeams: episode.mentionedTeams,
          topics: episode.topics,
          headline: episode.summary?.headline ?? null,
          bullets: episode.summary?.bullets ?? [],
          hasSource: episode.hasSource,
        };
      },
    },
    searchEpisode: {
      description:
        "Sök i avsnittets transkript efter ett namn, lag eller ämne. Använd när användaren frågar vad som sades om något specifikt.",
      inputSchema: z.object({
        query: z.string().min(2).max(80).describe("Sökord, lagnamn eller person"),
      }),
      execute: async ({ query }: { query: string }) => {
        const hits = await searchEpisodeChunks(episodeId, query);
        if (!hits.length) {
          return { hits: [], message: "Inget i avsnittet matchade sökningen." };
        }
        return {
          hits: hits.map((h) => ({
            quote: h.quote,
            timestamp: formatTimestamp(h.startSeconds),
          })),
        };
      },
    },
  };
}
