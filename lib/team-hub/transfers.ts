import "server-only";

import { createServerClient, isSupabaseConfigured } from "@/lib/supabase";
import {
  resolveTransferStatus,
  type TransferStatus,
} from "@/lib/transfer-status";

export interface TransferRadarItem {
  id: string;
  slug: string | null;
  title: string;
  sourceName: string | null;
  publishedAt: string | null;
  status: TransferStatus;
  label: "Rykte" | "Bekräftad";
  sourceCount: number;
}

export async function getTransferRadar(teamSlug: string): Promise<TransferRadarItem[]> {
  if (!isSupabaseConfigured()) return [];

  try {
    const db = createServerClient();
    const { data: entity } = await db
      .from("entities")
      .select("id")
      .eq("type", "team")
      .eq("slug", teamSlug)
      .maybeSingle();
    if (!entity?.id) return [];

    const since = new Date(Date.now() - 30 * 24 * 3600_000).toISOString();
    const { data } = await db
      .from("articles")
      .select("id, slug, title, source_name, published_at, source_count, duplicate_sources")
      .eq("sport", "football")
      .eq("status", "published")
      .eq("event_type", "transfer")
      .contains("entity_ids", [entity.id])
      .gte("published_at", since)
      .order("published_at", { ascending: false })
      .limit(8);

    return (data ?? []).map((article) => {
      const resolved = resolveTransferStatus({
        sourceCount: article.source_count,
        sourceName: article.source_name,
        title: article.title,
        duplicateSources: Array.isArray(article.duplicate_sources)
          ? (article.duplicate_sources as string[])
          : null,
      });
      return {
        id: String(article.id),
        slug: article.slug ? String(article.slug) : null,
        title: String(article.title),
        sourceName: article.source_name ? String(article.source_name) : null,
        publishedAt: article.published_at ? String(article.published_at) : null,
        status: resolved.status,
        label: resolved.label,
        sourceCount: resolved.sourceCount,
      };
    });
  } catch {
    return [];
  }
}
