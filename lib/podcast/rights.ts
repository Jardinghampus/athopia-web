/**
 * Podcast public-surface policy (Athopia / AGENTS.md).
 *
 * Transcripts and raw enclosure URLs are INTERNAL (os RAG / entity extraction).
 * Public web: title, show name, Athopia topic tags, Spotify embed or outbound listen link.
 */

/** Never expose podcast_chunks.text or full transcript on public routes. */
export const PODCAST_PUBLIC_POLICY = {
  allowInlineEnclosureAudio: false,
  allowTranscriptDisplay: false,
  allowTranscriptSearchResults: false,
  maxTopicTags: 4,
} as const;

export function formatPodcastContextLine(topics: string[], teams: string[]): string | null {
  const parts = [
    ...topics.slice(0, PODCAST_PUBLIC_POLICY.maxTopicTags),
    ...teams.slice(0, 2).map((t) => t.trim()),
  ].filter(Boolean);
  if (parts.length === 0) return null;
  return parts.join(' · ');
}
