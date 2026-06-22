import type { Metadata } from "next";
import { ArticleCard } from "@/components/ui/ArticleCard";
import { createServerClient, isSupabaseConfigured } from "@/lib/supabase";
import type { Article } from "@/lib/types";
import { Newspaper } from "lucide-react";

export const dynamic = 'force-dynamic';

function mapArticle(row: any): Article {
  return {
    id: String(row.id),
    slug: String(row.slug),
    title: String(row.title ?? ""),
    summary: String(row.summary ?? ""),
    content: row.content ?? null,
    sourceUrl: row.source_url ?? null,
    sourceName: String(row.source_name ?? "Okänd källa"),
    sourceType: row.source_type ?? null,
    imageUrl: row.image_url ?? null,
    publishedAt: String(row.published_at ?? new Date().toISOString()),
    updatedAt: row.updated_at ?? null,
    importanceScore: row.importance_score ?? null,
    sentimentScore: row.sentiment_score ?? null,
    entities: Array.isArray(row.entities) ? row.entities : [],
  };
}

async function getTeam(slug: string): Promise<{ id: string; name: string } | null> {
  if (!isSupabaseConfigured()) return null;
  try {
    const supabase = createServerClient();
    const { data } = await supabase
      .from("entities")
      .select("id,name")
      .eq("slug", slug)
      .eq("type", "team")
      .maybeSingle();
    return data ? { id: String(data.id), name: String(data.name) } : null;
  } catch {
    return null;
  }
}

async function getTeamArticles(teamId: string): Promise<Article[]> {
  if (!isSupabaseConfigured()) return [];
  try {
    const supabase = createServerClient();
    const { data } = await supabase
      .from("articles")
      .select("*")
      .eq("status", "published")
      .contains("entity_ids", [teamId])
      .order("published_at", { ascending: false })
      .limit(24);
    return (data ?? []).map(mapArticle);
  } catch {
    return [];
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const team = await getTeam(slug);
  const name = team?.name ?? slug;
  return {
    title: `${name} — Nyheter`,
    description: `Senaste fotbollsnyheter om ${name} på Athopia.`,
  };
}

export default async function LagNyheterPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const team = await getTeam(slug);
  const teamName = team?.name ?? slug;
  const articles = team ? await getTeamArticles(team.id) : [];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
      <h2 className="font-bold text-3xl text-foreground mb-6">
        NYHETER — {teamName.toUpperCase()}
      </h2>

      {articles.length === 0 ? (
        <div className="flex flex-col items-center gap-3 py-20 text-muted-foreground">
          <Newspaper className="w-10 h-10 opacity-30" />
          <p className="text-sm">Inga nyheter hittades för {teamName}.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {articles.map((article) => (
            <ArticleCard key={article.id} article={article} size="md" />
          ))}
        </div>
      )}
    </div>
  );
}
