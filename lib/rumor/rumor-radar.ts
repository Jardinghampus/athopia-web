import "server-only";

import { createServerClient, isSupabaseConfigured } from "@/lib/supabase";
import { articlePublicPath } from "@/lib/provenance";
import { rumorStatus, type RumorStatus } from "@/lib/rumor/rumor-status";

export { rumorStatus, type RumorStatus } from "@/lib/rumor/rumor-status";

/**
 * Ryktesradar (Slice 3) — status derived from `transfer_confidence` (0..1),
 * distinct from the existing team-hub TransferRadar (2-state rykte/bekraftad
 * heuristic without confidence). Behind RUMOR_RADAR flag, off by default.
 */

export function isRumorRadarEnabled(): boolean {
  return process.env.RUMOR_RADAR === "true";
}

export interface RumorRadarItem {
  title: string;
  href: string;
  sourceName: string | null;
  sourceCount: number;
  confidence: number;
  status: RumorStatus;
  publishedAt: string | null;
  teamIds: string[];
}

export type RumorRadarGroups = Record<RumorStatus, RumorRadarItem[]>;

function emptyGroups(): RumorRadarGroups {
  return { bekraftat: [], rapporteras: [], ryktas: [], dementerat: [] };
}

/**
 * Transfer articles with a non-null confidence score, sport=football, recent
 * first. Items without a score are untriaged and excluded — never fabricate
 * a status.
 */
export async function getRumorRadar(limit = 60): Promise<RumorRadarGroups> {
  const groups = emptyGroups();
  if (!isSupabaseConfigured()) return groups;

  try {
    const db = createServerClient();
    const { data, error } = await db
      .from("articles")
      .select(
        "title, slug, source_name, source_count, transfer_confidence, published_at, entity_ids, url, rights_status, is_athopia_generated, summary",
      )
      .eq("sport", "football")
      .eq("status", "published")
      .or("news_tag.eq.transfer,event_type.eq.transfer")
      .not("transfer_confidence", "is", null)
      .order("published_at", { ascending: false, nullsFirst: false })
      .limit(limit);

    if (error || !data) return groups;

    for (const row of data as Record<string, unknown>[]) {
      const confidence = Number(row.transfer_confidence);
      if (!Number.isFinite(confidence)) continue;

      const item: RumorRadarItem = {
        title: String(row.title ?? ""),
        href: articlePublicPath({
          slug: (row.slug as string | null) ?? null,
          rights_status: row.rights_status as string | null,
          is_athopia_generated: row.is_athopia_generated as boolean | null,
          url: row.url as string | null,
        }),
        sourceName: (row.source_name as string | null) ?? null,
        sourceCount: Number(row.source_count ?? 1) || 1,
        confidence,
        status: rumorStatus({
          title: row.title as string | null,
          summary: row.summary as string | null,
          transferConfidence: confidence,
        }),
        publishedAt: (row.published_at as string | null) ?? null,
        teamIds: Array.isArray(row.entity_ids) ? (row.entity_ids as string[]) : [],
      };

      groups[item.status].push(item);
    }

    return groups;
  } catch {
    return groups;
  }
}
