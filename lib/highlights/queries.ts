import { createServerClient, isSupabaseConfigured } from "@/lib/supabase";

const SPORT = "football";

export interface Highlight {
  id: string;
  title: string;
  source_url: string | null;
  thumbnail_url: string | null;
  entity_ids: string[];
  published_at: string | null;
}

/**
 * SVT-höjdpunkter från `highlights`-vyn (os producerar via Inoreader-taggen).
 * teamEntityId → bara det lagets klipp; utelämnat → hela Allsvenskan.
 * Länk-kort ut till SVT — web re-hostar aldrig video.
 */
export async function getHighlights(opts?: {
  teamEntityId?: string | null;
  limit?: number;
}): Promise<Highlight[]> {
  if (!isSupabaseConfigured()) return [];
  try {
    const db = createServerClient();
    let q = db
      .from("highlights")
      .select("id, title, source_url, thumbnail_url, entity_ids, published_at")
      .eq("sport", SPORT)
      .order("published_at", { ascending: false })
      .limit(opts?.limit ?? 8);

    if (opts?.teamEntityId) {
      q = q.contains("entity_ids", [opts.teamEntityId]);
    }

    const { data } = await q;
    return (data ?? []) as Highlight[];
  } catch {
    return [];
  }
}
