import type { FeedItem } from "@/lib/types";
import { mapImportanceTier } from "@/lib/feed/importance";

/** Mappar news_feed / news_feed_clustered-rad till FeedItem. */
export function mapNewsFeedRow(a: {
  id: string;
  title: string;
  source_name?: string | null;
  url?: string | null;
  published_at: string | null;
  summary?: string | null;
  news_tag?: string | null;
  source_count?: number | null;
  story_cluster_id?: string | null;
  importance_score?: number | null;
  push_priority?: string | null;
  slug?: string | null;
  url_hash?: string | null;
}): FeedItem {
  const href = a.url
    ?? (a.slug ? `/artikel/${a.slug}` : a.url_hash ? `/artikel/${a.url_hash}` : "#");

  return {
    id: a.id,
    type: "news",
    title: a.title,
    source: a.source_name ?? null,
    time: a.published_at ?? new Date().toISOString(),
    href,
    subtitle: a.summary ?? null,
    newsTag: a.news_tag ?? null,
    sourceCount: a.source_count ?? null,
    storyClusterId: a.story_cluster_id ?? null,
    importanceTier: mapImportanceTier(a.importance_score ?? null, a.push_priority ?? null),
  };
}
