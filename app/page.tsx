import type { Metadata } from "next";
import AthopiaLanding, { type LandingArticle } from "@/components/landing/AthopiaLanding";
import { createServerClient, isSupabaseConfigured } from "@/lib/supabase";

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: "Athopia — Allsvenskans hemma på nätet",
  description:
    "Realtidsnyheter, AI-sammanfattningar, djupstatistik och ditt lags forum — allt på ett ställe. Allsvenskan-versionen av The Athletic.",
};

async function getLatestArticles(): Promise<LandingArticle[]> {
  if (!isSupabaseConfigured()) return [];
  try {
    const supabase = createServerClient();
    const { data } = await supabase
      .from("articles")
      .select("*")
      .eq("status", "published")
      .eq("is_processed", true)
      .order("published_at", { ascending: false })
      .limit(4);

    return ((data as Record<string, unknown>[] | null) ?? [])
      .map((row): LandingArticle => ({
        id: String(row.id ?? ""),
        slug: String(row.slug ?? ""),
        title: String(row.title ?? ""),
        summary: String(row.summary ?? row.ai_summary ?? ""),
        sourceName: String(row.source_name ?? row.sourceName ?? "Athopia"),
        publishedAt: String(row.published_at ?? row.publishedAt ?? row.created_at ?? ""),
      }))
      .filter((a) => a.slug && a.title);
  } catch {
    return [];
  }
}

export default async function LandingPage() {
  const articles = await getLatestArticles();
  return <AthopiaLanding articles={articles} />;
}
