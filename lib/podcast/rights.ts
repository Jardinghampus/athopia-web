/**
 * Podcast public-surface policy (Athopia / AGENTS.md).
 *
 * Transcripts and raw enclosure URLs are INTERNAL (os RAG / entity extraction).
 * Public web: title, show name, Athopia topic tags, Spotify embed or outbound listen link.
 */

/**
 * Founder-beslut 2026-07-10 (Allsvenskans hemmaplan M3): korta transkriptcitat
 * får visas i sökresultat BAKOM PRO-gate, med obligatorisk attribution
 * (podd + avsnitt + tidsstämpel + länk). Aldrig hela transkript, aldrig
 * inline-audio på raw enclosure, aldrig citat utan källhänvisning.
 */
export const PODCAST_PUBLIC_POLICY = {
  allowInlineEnclosureAudio: false,
  allowTranscriptDisplay: false,
  /** PRO-only, korta citat med attribution — se maxQuoteChars. */
  allowTranscriptSearchResults: true,
  maxQuoteChars: 200,
  maxTopicTags: 4,
} as const;

/** Klipp ett citat runt sökträffen — max maxQuoteChars, hela ord, ellipsis. */
export function excerptAround(text: string, query: string): string {
  const max = PODCAST_PUBLIC_POLICY.maxQuoteChars;
  const idx = text.toLowerCase().indexOf(query.toLowerCase());
  const half = Math.floor(max / 2);
  const start = Math.max(0, (idx === -1 ? 0 : idx) - half);
  let slice = text.slice(start, start + max).trim();
  if (start > 0) slice = "…" + slice.replace(/^\S*\s/, "");
  if (start + max < text.length) slice = slice.replace(/\s\S*$/, "") + " …";
  return slice;
}

export function formatPodcastContextLine(topics: string[], teams: string[]): string | null {
  const parts = [
    ...topics.slice(0, PODCAST_PUBLIC_POLICY.maxTopicTags),
    ...teams.slice(0, 2).map((t) => t.trim()),
  ].filter(Boolean);
  if (parts.length === 0) return null;
  return parts.join(' · ');
}
