/**
 * app/podcast/page.tsx — Podcast-lista
 * ─────────────────────────────────────────────────────────────────────────────
 * - Sökbar lista (pgvector fulltext via Supabase)
 * - PodcastCard per episod
 * - ISR 3600s
 * ─────────────────────────────────────────────────────────────────────────────
 */

import type { Metadata } from "next";
import { Mic } from "lucide-react";
import { PodcastCard } from "@/components/ui/PodcastCard";
import { createServerClient, isSupabaseConfigured } from "@/lib/supabase";
import type { Podcast } from "@/lib/types";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "Podcast",
  description: "Lyssna på Sveriges bästa fotbollspodcasts med AI-transkript och analys på Athopia.",
};

async function getEpisodes(query?: string): Promise<Podcast[]> {
  if (!isSupabaseConfigured()) return [];
  try {
    const supabase = createServerClient();
    let q = supabase
      .from("podcast_episodes")
      .select("*")
      .order("published_at", { ascending: false })
      .limit(24);

    if (query) {
      q = q.textSearch("title_search_vector", query, {
        type: "websearch",
        config: "swedish",
      });
    }

    const { data } = await q;
    return (data as any as Podcast[]) ?? [];
  } catch {
    return [];
  }
}

interface SearchParams {
  q?: string;
}

export default async function PodcastListPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const { q } = await searchParams;
  const episodes = await getEpisodes(q);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10">
      {/* Header */}
      <div className="flex items-center gap-3 mb-2">
        <div className="w-10 h-10 rounded-xl pitch-gradient flex items-center justify-center">
          <Mic className="w-5 h-5 text-white" />
        </div>
        <h1 className="font-heading text-5xl text-foreground">PODCAST</h1>
      </div>
      <p className="text-muted-foreground mb-8">
        AI-transkript, entiteter och tidsstämplar för varje avsnitt.
      </p>

      {/* Sökformulär (statiskt – POST-navigerar) */}
      <form method="GET" className="mb-8">
        <input
          type="search"
          name="q"
          defaultValue={q}
          placeholder="Sök avsnitt, lag, spelare…"
          className="w-full max-w-md px-4 py-2.5 rounded-xl bg-card border border-border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-pitch transition-colors"
          aria-label="Sök podcast-avsnitt"
        />
      </form>

      {/* Episodlista */}
      {episodes.length === 0 ? (
        <div className="text-center py-20">
          <Mic className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">
            {q ? `Inga avsnitt matchade "${q}"` : "Inga avsnitt tillgängliga ännu."}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {episodes.map((podcast) => (
            <PodcastCard key={podcast.id} podcast={podcast} />
          ))}
        </div>
      )}
    </div>
  );
}
