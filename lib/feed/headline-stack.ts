import type { FeedModule } from "@/lib/feed/build-feed-modules";

/** True when server modules include a non-empty headline_stack. */
export function hasHeadlineStackModule(modules: FeedModule[]): boolean {
  return modules.some(
    (m) =>
      m.type === "headline_stack" &&
      Array.isArray(m.payload.headlines) &&
      m.payload.headlines.length > 0,
  );
}

/**
 * Story IDs already shown in headline_stack — use to suppress hero/list
 * duplicates on /nyheter (parity with iOS carousel hide).
 */
export function extractHeadlineStackIds(modules: FeedModule[]): Set<string> {
  const ids = new Set<string>();
  for (const mod of modules) {
    if (mod.type !== "headline_stack") continue;
    const headlines = Array.isArray(mod.payload.headlines)
      ? mod.payload.headlines
      : [];
    for (const raw of headlines) {
      const row = raw as Record<string, unknown>;
      const id = typeof row.id === "string" ? row.id : null;
      if (id) ids.add(id);
    }
  }
  return ids;
}

/** Titles for best-effort dedupe when news_feed vs clustered IDs diverge. */
export function extractHeadlineStackTitles(modules: FeedModule[]): Set<string> {
  const titles = new Set<string>();
  for (const mod of modules) {
    if (mod.type !== "headline_stack") continue;
    const headlines = Array.isArray(mod.payload.headlines)
      ? mod.payload.headlines
      : [];
    for (const raw of headlines) {
      const row = raw as Record<string, unknown>;
      const title =
        typeof row.title === "string" ? row.title.trim().toLowerCase() : "";
      if (title) titles.add(title);
    }
  }
  return titles;
}
