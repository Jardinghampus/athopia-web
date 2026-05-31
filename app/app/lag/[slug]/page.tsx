/**
 * app/lag/[slug]/page.tsx — Lagprofilsida
 * ─────────────────────────────────────────────────────────────────────────────
 * - Sportsmonks: position, form, mål (ISR 3600s)
 * - Coverage feed: artiklar taggade med laget (Supabase)
 * - Narrative panel med trend-pil
 * - Sentiment-indikator
 * - JSON-LD: SportsTeam
 * ─────────────────────────────────────────────────────────────────────────────
 */

import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import { TrendingUp, TrendingDown, Minus, Brain } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { ArticleCard } from "@/components/ui/ArticleCard";
import { NarrativeCard } from "@/components/ui/NarrativeCard";
import { createServerClient } from "@/lib/supabase";
import type { Article, Narrative } from "@/lib/types";

export const revalidate = 3600;

// ─── Typer ─────────────────────────────────────────────────────────────────────
interface TeamData {
  id: string;
  name: string;
  slug: string;
  logo_url: string | null;
  sportsmonks_id: number | null;
  sentiment: number | null; // -1 till 1
}

// ─── Data-hämtning ─────────────────────────────────────────────────────────────
async function getTeam(slug: string): Promise<TeamData | null> {
  try {
    const supabase = createServerClient();
    const { data } = await supabase
      .from("teams")
      .select("*")
      .eq("slug", slug)
      .single();
    return data as TeamData | null;
  } catch {
    return null;
  }
}

async function getTeamArticles(teamSlug: string): Promise<Article[]> {
  try {
    const supabase = createServerClient();
    // Hämtar artiklar där entities innehåller laget via join
    const { data } = await supabase
      .from("articles")
      .select("*")
      .contains("entities", [{ slug: teamSlug, type: "team" }])
      .order("published_at", { ascending: false })
      .limit(6);
    return (data as Article[]) ?? [];
  } catch {
    return [];
  }
}

async function getTeamAISummary(teamSlug: string): Promise<Article | null> {
  try {
    const supabase = createServerClient();
    const { data } = await supabase
      .from("articles")
      .select("*")
      .eq("source_name", "Athopia AI")
      .eq("status", "published")
      .filter("metadata->>team", "eq", teamSlug)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    return (data as Article) ?? null;
  } catch {
    return null;
  }
}

async function getTeamNarratives(teamSlug: string): Promise<Narrative[]> {
  try {
    const supabase = createServerClient();
    const { data } = await supabase
      .from("narratives")
      .select("*")
      .contains("entities", [{ slug: teamSlug, type: "team" }])
      .order("score", { ascending: false })
      .limit(3);
    return (data as Narrative[]) ?? [];
  } catch {
    return [];
  }
}

// ─── Metadata ──────────────────────────────────────────────────────────────────
export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const team = await getTeam(slug);
  if (!team) return { title: "Lag hittades inte" };

  return {
    title: team.name,
    description: `Nyheter, narrativ och statistik för ${team.name} på Athopia.`,
    openGraph: {
      title: `${team.name} | Athopia`,
      description: `Följ ${team.name} på Athopia — nyheter, form och analytik.`,
      images: team.logo_url ? [{ url: team.logo_url }] : [],
    },
  };
}

// ─── JSON-LD: SportsTeam ──────────────────────────────────────────────────────
function TeamJsonLd({ team }: { team: TeamData }) {
  const data = {
    "@context": "https://schema.org",
    "@type": "SportsTeam",
    name: team.name,
    url: `https://athopia.se/lag/${team.slug}`,
    logo: team.logo_url ?? undefined,
    sport: "Soccer",
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}

// ─── Sentiment-indikator ───────────────────────────────────────────────────────
function SentimentBar({ value }: { value: number }) {
  // -1 = mycket negativt, 0 = neutralt, 1 = mycket positivt
  const pct = ((value + 1) / 2) * 100;
  const label =
    value >= 0.3 ? "Positiv" : value <= -0.3 ? "Negativ" : "Neutral";
  const color =
    value >= 0.3
      ? "bg-pitch"
      : value <= -0.3
      ? "bg-red-500"
      : "bg-muted-foreground";

  return (
    <div className="space-y-2">
      <div className="flex justify-between text-xs text-muted-foreground">
        <span>Sentiment</span>
        <span className="font-medium">{label}</span>
      </div>
      <div className="h-2 rounded-full bg-secondary overflow-hidden">
        <div
          className={`h-full rounded-full transition-all ${color}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

// ─── Form-rad ─────────────────────────────────────────────────────────────────
function FormRow({ form }: { form: string[] }) {
  const colorMap: Record<string, string> = {
    W: "bg-pitch text-white",
    D: "bg-muted text-foreground",
    L: "bg-red-500/20 text-red-400",
  };
  return (
    <div className="flex gap-1">
      {form.slice(-5).map((r, i) => (
        <span
          key={i}
          className={`w-7 h-7 rounded-full text-xs font-bold flex items-center justify-center ${colorMap[r] ?? "bg-muted"}`}
        >
          {r}
        </span>
      ))}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default async function LagPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const team = await getTeam(slug);

  if (!team) notFound();

  const [articles, narratives, aiSummary] = await Promise.all([
    getTeamArticles(slug),
    getTeamNarratives(slug),
    getTeamAISummary(slug),
  ]);

  return (
    <>
      <TeamJsonLd team={team} />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10">
        {/* Team-header */}
        <div className="flex items-start gap-6 mb-10">
          {team.logo_url && (
            <div className="relative w-20 h-20 rounded-2xl overflow-hidden bg-card border border-border shrink-0">
              <Image
                src={team.logo_url}
                alt={`${team.name} logotyp`}
                fill
                className="object-contain p-2"
                sizes="80px"
              />
            </div>
          )}
          <div>
            <h1 className="font-heading text-5xl text-foreground leading-none mb-2">
              {team.name.toUpperCase()}
            </h1>
            {team.sentiment !== null && (
              <div className="max-w-xs mt-4">
                <SentimentBar value={team.sentiment} />
              </div>
            )}
          </div>
        </div>

        {/* AI-sammanfattning */}
        {aiSummary && (
          <section className="relative overflow-hidden rounded-xl border border-amber-500/30 bg-amber-500/5 p-5 mb-8">
            <div className="flex items-start gap-3">
              <Brain className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-semibold text-amber-500 uppercase tracking-wide mb-1.5">
                  Athopia AI · {new Date(aiSummary.publishedAt ?? "").toLocaleDateString("sv-SE", { day: "numeric", month: "short" })}
                </p>
                <h2 className="font-heading text-xl text-foreground mb-2">{aiSummary.title}</h2>
                <p className="text-sm text-foreground/80 leading-relaxed">
                  {aiSummary.summary ?? aiSummary.content?.slice(0, 300)}
                </p>
              </div>
            </div>
          </section>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-8">
          {/* Artiklar */}
          <section>
            <h2 className="font-heading text-2xl text-foreground mb-4">
              SENASTE NYHETER
            </h2>
            {articles.length === 0 ? (
              <p className="text-muted-foreground text-sm">
                Inga artiklar hittades för {team.name}.
              </p>
            ) : (
              <div className="flex flex-col gap-3">
                {articles.map((a) => (
                  <ArticleCard key={a.id} article={a} size="sm" />
                ))}
              </div>
            )}
          </section>

          {/* Sidebar: narrativer */}
          <aside className="flex flex-col gap-6">
            <div>
              <h2 className="font-heading text-2xl text-foreground mb-4">
                NARRATIV
              </h2>
              {narratives.length === 0 ? (
                <p className="text-sm text-muted-foreground">Inga aktiva narrativ.</p>
              ) : (
                <div className="flex flex-col gap-3">
                  {narratives.map((n) => (
                    <NarrativeCard key={n.id} narrative={n} />
                  ))}
                </div>
              )}
            </div>
          </aside>
        </div>
      </div>
    </>
  );
}
