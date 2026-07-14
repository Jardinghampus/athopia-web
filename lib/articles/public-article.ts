import "server-only";

import { createServerClient } from "@/lib/supabase";
import type { Article } from "@/lib/types";
import {
  resolveRightsStatus,
  sanitizeArticleForPublic,
} from "@/lib/provenance";

const SPORT = "football";

export async function getPublicArticleBySlug(slug: string): Promise<Article | null> {
  const supabase = createServerClient();
  const { data, error } = await supabase
    .from("articles")
    .select(
      "id,slug,title,summary,content,url,source_name,published_at,updated_at,content_origin,rights_status,is_athopia_generated,sport",
    )
    .eq("slug", slug)
    .eq("sport", SPORT)
    .eq("status", "published")
    .maybeSingle();

  if (error || !data) return null;

  const row = data as Record<string, unknown>;
  const article: Article = {
    id: String(row.id),
    slug: String(row.slug ?? ""),
    title: String(row.title ?? ""),
    summary: String(row.summary ?? ""),
    content: (row.content as string | null) ?? null,
    sourceUrl: (row.url as string | null) ?? null,
    url: (row.url as string | null) ?? null,
    sourceName: String(row.source_name ?? "Okänd källa"),
    imageUrl: null,
    publishedAt: String(row.published_at ?? new Date().toISOString()),
    updatedAt: (row.updated_at as string | null) ?? null,
    entities: [],
    contentOrigin: (row.content_origin as Article["contentOrigin"]) ?? null,
    rightsStatus: resolveRightsStatus(
      row as Parameters<typeof resolveRightsStatus>[0],
    ),
    isAthopiaGenerated: (row.is_athopia_generated as boolean | null) ?? null,
  };

  return sanitizeArticleForPublic(article);
}

export async function getArticleDiscussionCount(articleId: string): Promise<number> {
  const { count, error } = await createServerClient()
    .from("forum_posts")
    .select("id", { count: "exact", head: true })
    .eq("article_id", articleId)
    .eq("sport", SPORT)
    .eq("status", "published");

  return error ? 0 : (count ?? 0);
}
