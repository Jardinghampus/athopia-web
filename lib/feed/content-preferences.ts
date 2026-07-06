/** Onboarding content_types → news_feed.news_tag filter (Echo taxonomi). */

export type ContentInterest =
  | "transfer"
  | "analysis"
  | "match"
  | "statistics"
  | "injury"
  | "table";

const INTEREST_TO_NEWS_TAGS: Record<ContentInterest, string[]> = {
  transfer: ["transfer"],
  analysis: ["news"],
  match: ["match"],
  injury: ["injury"],
  // Statistik/tabell är produktytor — smalnar inte nyhetsflödet.
  statistics: [],
  table: [],
};

/** Returnerar news_tag-lista att filtrera på, eller null = ingen tagg-filter. */
export function interestsToNewsTags(
  interests: string[] | null | undefined
): string[] | null {
  if (!interests?.length) return null;

  const tags = new Set<string>();
  for (const interest of interests) {
    const mapped = INTEREST_TO_NEWS_TAGS[interest as ContentInterest];
    if (mapped?.length) mapped.forEach((t) => tags.add(t));
  }

  if (tags.size === 0) return null;
  return [...tags];
}
