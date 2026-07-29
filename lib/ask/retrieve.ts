/**
 * Slice 3 P1 "Fråga Athopia" — grounded retrieval. Behind FRAGA_ATHOPIA flag,
 * off by default so prod is unchanged.
 *
 * No embeddings yet — ILIKE/entity match over recent published football
 * articles. Embeddings are a later upgrade once this shape proves useful.
 */
import "server-only";

import { createServerClient, isSupabaseConfigured } from "@/lib/supabase";
import { shapeGroundingRows, type GroundingItem } from "@/lib/ask/ask-shape";

export { shouldAnswer, shapeGroundingRows, type GroundingItem } from "@/lib/ask/ask-shape";

export function isFragaAthopiaEnabled(): boolean {
  return process.env.FRAGA_ATHOPIA === "true";
}

const MAX_RESULTS = 6;
const LOOKBACK_DAYS = 14;

/**
 * Pulls up to MAX_RESULTS relevant recent football articles for `query` via
 * ILIKE title match, most recent first. Returns [] on any failure or when
 * unconfigured — callers must treat that as "no grounding", never fabricate.
 */
export async function retrieveGrounding(
  query: string,
  db?: ReturnType<typeof createServerClient>,
): Promise<GroundingItem[]> {
  const q = query.trim();
  if (!q) return [];
  if (!db && !isSupabaseConfigured()) return [];

  try {
    const client = db ?? createServerClient();
    const since = new Date(Date.now() - LOOKBACK_DAYS * 24 * 60 * 60 * 1000).toISOString();

    const { data, error } = await client
      .from("articles")
      .select("title, summary, source_name, url, slug, rights_status, is_athopia_generated, published_at")
      .eq("sport", "football")
      .eq("status", "published")
      .gte("published_at", since)
      .ilike("title", `%${q}%`)
      .order("published_at", { ascending: false, nullsFirst: false })
      .limit(MAX_RESULTS);

    if (error || !data) return [];

    return shapeGroundingRows(data as Record<string, unknown>[]);
  } catch {
    return [];
  }
}
