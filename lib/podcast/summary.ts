/**
 * Original Athopia-sammanfattning av ett poddavsnitt.
 *
 * Transkriptet är internt. Det som cacheas i metadata.athopia_summary är
 * egenskriven text (headline + bullets), aldrig ett transkriptutdrag.
 */

export type AthopiaPodcastSummary = {
  headline: string;
  bullets: string[];
  generatedAt: string;
};

const MAX_HEADLINE = 180;
const MAX_BULLET = 220;
const MIN_BULLETS = 3;
const MAX_BULLETS = 8;

export function asMetadataRecord(meta: unknown): Record<string, unknown> {
  if (meta && typeof meta === "object" && !Array.isArray(meta)) {
    return { ...(meta as Record<string, unknown>) };
  }
  return {};
}

export function parseAthopiaSummary(meta: unknown): AthopiaPodcastSummary | null {
  const raw = asMetadataRecord(meta).athopia_summary;
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return null;
  const row = raw as Record<string, unknown>;
  const headline = typeof row.headline === "string" ? row.headline.trim() : "";
  const generatedAt = typeof row.generatedAt === "string" ? row.generatedAt : "";
  const bullets = Array.isArray(row.bullets)
    ? row.bullets
        .filter((b): b is string => typeof b === "string")
        .map((b) => b.trim())
        .filter(Boolean)
        .slice(0, MAX_BULLETS)
    : [];
  if (!headline || bullets.length < MIN_BULLETS || !generatedAt) return null;
  return {
    headline: headline.slice(0, MAX_HEADLINE),
    bullets: bullets.map((b) => b.slice(0, MAX_BULLET)),
    generatedAt,
  };
}

export function summaryTeaser(summary: AthopiaPodcastSummary, maxChars = 160): string {
  const first = summary.bullets[0] ?? summary.headline;
  if (first.length <= maxChars) return first;
  return `${first.slice(0, maxChars).trim()}…`;
}

/** Jämnt spridda chunkar, totalt högst maxChars — täcker avsnittet utan hela transkriptet. */
export function sampleChunkTexts(
  chunks: { text: string; chunkIndex: number }[],
  maxChars = 7_000,
): string {
  if (chunks.length === 0) return "";
  const ordered = [...chunks].sort((a, b) => a.chunkIndex - b.chunkIndex);
  const take = Math.min(ordered.length, 12);
  const step = (ordered.length - 1) / Math.max(take - 1, 1);
  const picked: string[] = [];
  let used = 0;
  for (let i = 0; i < take; i++) {
    const idx = Math.round(i * step);
    const piece = ordered[idx]?.text.trim();
    if (!piece) continue;
    if (used + piece.length > maxChars && picked.length >= MIN_BULLETS) break;
    picked.push(piece);
    used += piece.length;
  }
  return picked.join("\n\n---\n\n").slice(0, maxChars);
}

/** Fallback när chunks saknas men transkript finns: fem fönster genom avsnittet. */
export function sampleTranscript(text: string, maxChars = 7_000): string {
  const trimmed = text.trim();
  if (!trimmed) return "";
  if (trimmed.length <= maxChars) return trimmed;
  const windows = 5;
  const windowSize = Math.floor(maxChars / windows);
  const parts: string[] = [];
  for (let i = 0; i < windows; i++) {
    const start = Math.floor((i / (windows - 1)) * (trimmed.length - windowSize));
    parts.push(trimmed.slice(Math.max(0, start), start + windowSize).trim());
  }
  return parts.join("\n\n---\n\n");
}

export function parseModelSummaryJson(raw: string): AthopiaPodcastSummary | null {
  const start = raw.indexOf("{");
  const end = raw.lastIndexOf("}");
  if (start < 0 || end <= start) return null;
  try {
    const parsed: unknown = JSON.parse(raw.slice(start, end + 1));
    return parseAthopiaSummary({
      athopia_summary: {
        ...(parsed as Record<string, unknown>),
        generatedAt:
          typeof (parsed as { generatedAt?: string }).generatedAt === "string"
            ? (parsed as { generatedAt: string }).generatedAt
            : new Date().toISOString(),
      },
    });
  } catch {
    return null;
  }
}

export function formatTimestamp(seconds: number | null): string | null {
  if (seconds == null || !Number.isFinite(seconds) || seconds < 0) return null;
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}
