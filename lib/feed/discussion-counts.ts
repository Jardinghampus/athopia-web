import type { FeedItem } from "@/lib/types";
import { getDiscussionCounts } from "@/lib/supabase";
import { articleIdForDiscussionCount } from "@/lib/feed/article-id";

export { articleIdForDiscussionCount };

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
