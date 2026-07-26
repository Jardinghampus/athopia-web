/**
 * Pure "Fråga Athopia" shaping/grounding logic (Slice 3 P1). No server-only
 * import here so this stays testable with plain node:test — mirrors
 * lib/rumor/rumor-status.ts's split from lib/rumor/rumor-radar.ts.
 */
import { articlePublicPath } from "@/lib/provenance";

export type GroundingItem = {
  title: string;
  summary: string | null;
  sourceName: string | null;
  url: string;
  publishedAt: string | null;
};

/** True when there's enough grounding to let the model answer at all. */
export function shouldAnswer(context: GroundingItem[]): boolean {
  return context.length > 0;
}

/** Pure row → GroundingItem[] shaping, split out for testability. */
export function shapeGroundingRows(rows: Record<string, unknown>[]): GroundingItem[] {
  return rows.map((row) => ({
    title: String(row.title ?? ""),
    summary: (row.summary as string | null) ?? null,
    sourceName: (row.source_name as string | null) ?? null,
    url: articlePublicPath({
      slug: (row.slug as string | null) ?? null,
      rights_status: row.rights_status as string | null,
      is_athopia_generated: row.is_athopia_generated as boolean | null,
      url: row.url as string | null,
    }),
    publishedAt: (row.published_at as string | null) ?? null,
  }));
}
