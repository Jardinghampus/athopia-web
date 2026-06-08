import { Suspense } from "react";
import Link from "next/link";
import { ArrowRight, Zap, Brain } from "lucide-react";
import { PersonalizedFeed } from "@/components/PersonalizedFeed";
import { Skeleton } from "@/components/ui/skeleton";
import { ArticleCard } from "@/components/ui/ArticleCard";
import { NarrativeCard } from "@/components/ui/NarrativeCard";
import { ScoreWidget } from "@/components/ui/ScoreWidget";
import { createServerClient, isSupabaseConfigured } from "@/lib/supabase";
import { fetchAllsvenskanFixtures, fetchLiveScores } from "@/lib/sportsmonks";
import type { Article, Narrative } from "@/lib/types";
import type { SMFixture } from "@/lib/sportsmonks";

export const dynamic = 'force-dynamic';

async function getTopArticles(): Promise<Article[]> {
  if (!isSupabaseConfigured()) return [];
  try {
    const supabase = createServerClient();
    const { data } = await supabase
      .from("articles")
      .select("*")
      .eq("status", "published")
      .eq("is_processed", true)
      .order("published_at", { ascending: false })
      .limit(6);
    return (data as Article[]) ?? [];
  } catch {
    return [];
  }
}

async function getAllsvenskanDailySummary(): Promise<Article | null> {
  if (!isSupabaseConfigured()) return null;
  try {
    const supabase = createServerClient();
    const { data } = await supabase
      .from("articles")
      .select("*")
      .eq("source_name", "Athopia AI")
      .eq("status", "published")
      .filter("metadata->>type", "eq", "allsvenskan_daily")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    return (data as Article) ?? null;
  } catch {
    return null;
  }
}

async function getTrendingNarratives(): Promise<Narrative[]> {
  if (!isSupabaseConfigured()) return [];
  try {
    const supabase = createServerClient();
    const { data } = await supabase
      .from("narratives")
      .select("*")
      .order("score", { ascending: false })
      .limit(3);
    return (data as any as Narrative[]) ?? [];
  } catch {
    return [];
  }
}

async function getFixtures(): Promise<SMFixture[]> {
  if (!process.env.SPORTSMONKS_API_TOKEN || process.env.SPORTSMONKS_API_TOKEN === "placeholder_token") return [];
  try {
    const live = await fetchLiveScores();
    if (live.length > 0) return live.slice(0, 6);
    const allsv = await fetchAllsvenskanFixtures();
    return allsv.slice(0, 6);
  } catch {
    return [];
  }
}

function HeroNarrative({ narrative }: { narrative: Narrative }) {
  return (
    <section className="relative overflow-hidden rounded-2xl border border-border bg-card mb-10">
      <div className="absolute inset-0 pitch-gradient opacity-10 pointer-events-none" />
      <div className="relative p-6 sm:p-10">
        <div className="flex items-center gap-2 mb-4">
          <Zap className="w-4 h-4 text-pitch" />
          <span className="text-xs font-medium text-pitch uppercase tracking-widest">
            Trending narrativ
          </span>
        </div>
        <h1 className="font-heading text-4xl sm:text-6xl text-foreground mb-4 leading-none">
          {narrative.topic}
        </h1>
        <div className="flex items-center gap-6 text-sm text-muted-foreground">
          <span>{narrative.sourceCount} källor</span>
          <span className="flex items-center gap-1">
            Poäng <strong className="text-pitch">{narrative.score}</strong>
          </span>
        </div>
      </div>
    </section>
  );
}

function ScoreSection({ fixtures }: { fixtures: SMFixture[] }) {
  if (fixtures.length === 0) return null;
  const hasLive = fixtures.some((f) => f.state?.state === "inprogress");

  return (
    <aside className="flex flex-col gap-2">
      <div className="flex items-center justify-between mb-2">
        <h2 className="font-heading text-2xl text-foreground">
          {hasLive ? "LIVE" : "IDAG"}
        </h2>
        {hasLive && <span className="live-dot" />}
      </div>
      {fixtures.map((f) => (
        <ScoreWidget key={f.id} fixture={f} />
      ))}
    </aside>
  );
}

export default async function AppHomePage() {
  const [articles, narratives, fixtures, dailySummary] = await Promise.all([
    getTopArticles(),
    getTrendingNarratives(),
    getFixtures(),
    getAllsvenskanDailySummary(),
  ]);

  const heroNarrative = narratives[0] ?? null;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
      {dailySummary && (
        <section className="relative overflow-hidden rounded-2xl border border-pitch/30 bg-pitch/5 mb-8 p-6 sm:p-8">
          <div className="absolute inset-0 pitch-gradient opacity-5 pointer-events-none" />
          <div className="relative">
            <div className="flex items-center gap-2 mb-3">
              <Brain className="w-4 h-4 text-pitch" />
              <span className="text-xs font-semibold text-pitch uppercase tracking-widest">Athopia AI</span>
              <span className="text-xs text-muted-foreground ml-2">
                {new Date(dailySummary.publishedAt ?? "").toLocaleDateString("sv-SE", {
                  weekday: "long", day: "numeric", month: "long"
                })}
              </span>
            </div>
            <h2 className="font-heading text-3xl sm:text-4xl text-foreground mb-3 leading-tight">
              {dailySummary.title}
            </h2>
            <p className="text-sm text-muted-foreground line-clamp-3 max-w-2xl">
              {dailySummary.summary ?? dailySummary.content?.slice(0, 250)}
            </p>
          </div>
        </section>
      )}

      {heroNarrative && <HeroNarrative narrative={heroNarrative} />}

      <PersonalizedFeed />

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-8">
        <div>
          <div className="flex items-center justify-between mb-6">
            <h2 className="font-heading text-3xl text-foreground">SENASTE NYTT</h2>
            <Link
              href="/artikel"
              className="flex items-center gap-1 text-sm text-pitch hover:text-pitch-light transition-colors"
            >
              Alla nyheter <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          {articles.length === 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="rounded-2xl border border-border overflow-hidden">
                  <Skeleton className="aspect-[16/9] w-full" />
                  <div className="p-4 space-y-2">
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-3 w-full" />
                    <Skeleton className="h-3 w-2/3" />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {articles.map((article, i) => (
                <ArticleCard key={article.id} article={article} priority={i === 0} />
              ))}
            </div>
          )}
        </div>

        <div className="flex flex-col gap-8">
          <Suspense
            fallback={
              <div className="space-y-2">
                {Array.from({ length: 3 }).map((_, i) => (
                  <Skeleton key={i} className="h-20 rounded-xl" />
                ))}
              </div>
            }
          >
            <ScoreSection fixtures={fixtures} />
          </Suspense>

          <div>
            <h2 className="font-heading text-2xl text-foreground mb-4">
              TRENDANDE NARRATIV
            </h2>
            <div className="flex flex-col gap-3">
              {narratives.length === 0 ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <Skeleton key={i} className="h-24 rounded-xl" />
                ))
              ) : (
                narratives.map((n) => <NarrativeCard key={n.id} narrative={n} />)
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
