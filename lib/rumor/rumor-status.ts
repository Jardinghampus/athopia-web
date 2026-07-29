/**
 * Pure rumor-status classifier (Slice 3 Ryktesradar). No server-only import
 * here so this stays testable with plain node:test.
 */

export type RumorStatus = "ryktas" | "rapporteras" | "bekraftat" | "dementerat";

// ── Tunable thresholds ──────────────────────────────────────────────────────
/** transfer_confidence >= this → bekraftat (confirmed). */
export const CONFIRMED_THRESHOLD = 0.85;
/** transfer_confidence >= this (and below CONFIRMED_THRESHOLD) → rapporteras (reported). */
export const REPORTED_THRESHOLD = 0.6;
/** Below REPORTED_THRESHOLD → ryktas (rumored). */

/** Denial-language heuristic (Swedish) — wins over confidence score entirely. */
const DENIAL_PATTERN =
  /dement|dementerar|inte aktuell|avfärdar|nobbar|stannar kvar|förnekar/i;

export type RumorArticleInput = {
  title?: string | null;
  summary?: string | null;
  transferConfidence: number;
};

/** Pure status classifier — denial heuristic first, then confidence bands. */
export function rumorStatus(article: RumorArticleInput): RumorStatus {
  const text = `${article.title ?? ""} ${article.summary ?? ""}`;
  if (DENIAL_PATTERN.test(text)) return "dementerat";

  const c = article.transferConfidence;
  if (c >= CONFIRMED_THRESHOLD) return "bekraftat";
  if (c >= REPORTED_THRESHOLD) return "rapporteras";
  return "ryktas";
}
