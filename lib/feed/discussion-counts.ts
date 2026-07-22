import type { FeedItem } from "@/lib/types";
import { getDiscussionCounts } from "@/lib/supabase";

/** Strip hero-route `article-` prefix so counts key on articles.id. */
export function articleIdForDiscussionCount(id: string): string {
  return id.startsWith("article-") ? id.slice("article-".length) : id;
}

/** Attach optional discussionCount (>0 only) onto FeedItems. */
export async function withDiscussionCounts(
  items: FeedItem[],
): Promise<FeedItem[]> {
  if (items.length === 0) return items;
  const lookupIds = [
    ...new Set(items.map((i) => articleIdForDiscussionCount(i.id))),
  ];
  const counts = await getDiscussionCounts(lookupIds);
  return items.map((item) => {
    const n = counts[articleIdForDiscussionCount(item.id)] ?? 0;
    if (n <= 0) return item;
    return { ...item, discussionCount: n };
  });
}
