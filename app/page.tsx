/**
 * app/page.tsx — Startsida (Homepage)
 * ─────────────────────────────────────────────────────────────────────────────
 * Server Component med ISR:
 * - Hero: trending narrative från Supabase
 * - Top stories: 6 ArticleCard
 * - ScoreWidgets: live/dagens matcher från Sportsmonks
 * - Trending panel: top 3 narrativer
 *
 * Beslut: Sidan exporterar revalidate=60 för att hålla live-data färsk.
 * Supabase-anrop görs server-side utan att exponera service role key.
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { Suspense } from "react";
import Link from "next/link";
import { ArrowRight, Zap } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { ArticleCard } from "@/components/ui/ArticleCard";
import { NarrativeCard } from "@/components/ui/NarrativeCard";
import { ScoreWidget } from "@/components/ui/ScoreWidget";
import { createServerClient } from "@/lib/supabase";
import { getLiveFixtures, getTodayFixtures } from "@/lib/sportsmonks";
import type { Article, Narrative } from "@/lib/supabase";
import type { SMFixture } from "@/lib/sportsmonks";

export const revalidate = 60;

// ─── Data-hämtning ─────────────────────────────────────────────────────────────
async function getTopArticles(): Promise<Article[]> {
  try {
    const supabase = createServerClient();
    const { data } = await supabase
      .from("articles")
      .select("*")
      .order("published_at", { ascending: false })
      .limit(6);
    return (data as Article[]) ?? [];
  } catch {
    return [];
  }
}

async function getTrendingNarratives(): Promise<Narrative[]> {
  try {
    const supabase = createServerClient();
    const { data } = await supabase
      .from("narratives")
      .select("*")
      .order("score", { ascending: false })
      .limit(3);
    return (data as Narrative[]) ?? [];
  } catch {
    return [];
  }
}

async function getFixtures(): Promise<SMFixture[]> {
  try {
    const live = await getLiveFixtures();
    if (live.length > 0) return live.slice(0, 6);
    const today = await getTodayFixtures();
    return today.slice(0, 6);
  } catch {
    return [];
  }
}

// ─── Komponenter ───────────────────────────────────────────────────────────────

function HeroNarrative({ narrative }: { narrative: Narrative }) {
  return (
    <section className="relative overflow-hidden rounded-2xl border border-border bg-card mb-10">
      {/* Bakgrundseffekt */}
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
          <span>{narrative.source_count} källor</span>
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

// ─── Page ─────────────────────────────────────────────────────────────────────
export default async function HomePage() {
  const [articles, narratives, fixtures] = await Promise.all([
    getTopArticles(),
    getTrendingNarratives(),
    getFixtures(),
  ]);

  const heroNarrative = narratives[0] ?? null;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
      {/* Hero */}
      {heroNarrative && <HeroNarrative narrative={heroNarrative} />}

      {/* Huvudinnehåll: artiklar + sidebar */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-8">
        {/* Vänster: artiklar */}
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
            /* Fallback-skeleton om data saknas */
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
              {articles.map((article) => (
                <ArticleCard key={article.id} article={article} />
              ))}
            </div>
          )}
        </div>

        {/* Höger sidebar */}
        <div className="flex flex-col gap-8">
          {/* Live-matcher */}
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

          {/* Trending narrativer */}
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
                narratives.map((n, i) => (
                  <NarrativeCard key={n.id} narrative={n} rank={i + 1} />
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
