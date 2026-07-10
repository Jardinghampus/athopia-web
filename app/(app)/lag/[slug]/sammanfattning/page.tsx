/**
 * WEB-32: Lag-sammanfattningssida
 * Hämtar AI-genererade sammanfattningar från articles (source_name='Athopia AI')
 * + narrativ + forum-digest
 */

import type { Metadata } from "next";
import { NarrativeCard } from "@/components/ui/NarrativeCard";
import { ArticleCard } from "@/components/ui/ArticleCard";
import { createServerClient, isSupabaseConfigured } from "@/lib/supabase";
import type { Narrative, Entity, Article } from "@/lib/types";
import { Sparkles, TrendingUp, Brain } from "lucide-react";
import { PaywallGate } from "@/components/PaywallGate";
import { getUserPlan } from "@/lib/user-plan";

export const dynamic = 'force-dynamic'; // 5 min — ny sammanfattning kan komma

function mapNarrative(row: Record<string, unknown>): Narrative {
  return {
    id: String(row.id),
    topic: String(row.topic ?? ""),
    score: typeof row.score === "number" ? row.score : 0,
    sourceCount: Number(row.source_count ?? 0),
    trend: (row.trend ?? "stable") as Narrative["trend"],
    sentimentScore: (row.sentiment_score as number) ?? null,
    entities: Array.isArray(row.entities)
      ? (row.entities as Record<string, unknown>[]).map((e): Entity => ({
          id: String(e.id ?? e.slug ?? ""),
          name: String(e.name ?? ""),
          type: (e.type ?? "team") as Entity["type"],
          slug: String(e.slug ?? ""),
          imageUrl: (e.image_url as string) ?? null,
        }))
      : [],
    createdAt: String(row.created_at ?? new Date().toISOString()),
    updatedAt: String(row.updated_at ?? new Date().toISOString()),
  };
}

async function getTeamName(slug: string): Promise<string> {
  if (!isSupabaseConfigured()) return slug;
  try {
    const supabase = createServerClient();
    const { data } = await supabase
      .from("entities")
      .select("name")
      .eq("slug", slug)
      .eq("type", "team")
      .maybeSingle();
    return (data as { name: string } | null)?.name ?? slug;
  } catch {
    return slug;
  }
}

async function getTeamAISummaries(teamName: string): Promise<Article[]> {
  if (!isSupabaseConfigured()) return [];
  try {
    const supabase = createServerClient();
    const { data } = await supabase
      .from("articles")
      .select("*")
      .eq("source_name", "Athopia AI")
      .eq("status", "published")
      .ilike("metadata->>team_name", `%${teamName}%`)
      .order("created_at", { ascending: false })
      .limit(3);
    return (data as Article[]) ?? [];
  } catch {
    return [];
  }
}

async function getTeamNarratives(teamName: string): Promise<Narrative[]> {
  if (!isSupabaseConfigured()) return [];
  try {
    const supabase = createServerClient();
    const { data } = await supabase
      .from("narratives")
      .select("*")
      .ilike("topic", `%${teamName}%`)
      .order("score", { ascending: false })
      .limit(8);
    return (data ?? []).map((r) => mapNarrative(r as Record<string, unknown>));
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
  const name = await getTeamName(slug);
  return {
    title: `${name} — AI-sammanfattning | Athopia`,
    description: `AI-genererad daglig sammanfattning av ${name} — nyheter, trender och analys på Athopia-stil.`,
  };
}

export default async function LagSammanfattningPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const teamName = await getTeamName(slug);
  const plan = await getUserPlan();
  const hasAccess = plan !== "free";
  const [aiSummaries, narratives] = await Promise.all([
    hasAccess ? getTeamAISummaries(teamName) : Promise.resolve([]),
    getTeamNarratives(teamName),
  ]);

  const latestSummary = aiSummaries[0] ?? null;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
      <div className="flex items-center gap-3 mb-8">
        <div className="w-10 h-10 rounded-xl pitch-gradient flex items-center justify-center">
          <Brain className="w-5 h-5 text-white" />
        </div>
        <div>
          <h2 className="font-bold text-3xl text-foreground">
            AI-SAMMANFATTNING — {teamName.toUpperCase()}
          </h2>
          <p className="text-sm text-muted-foreground">
            Genereras automatiskt var 6:e timme av Athopia AI
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-8">
        {/* Vänster: AI-sammanfattningar (PRO+) */}
        <div className="space-y-6">
          <PaywallGate feature="aiSummaries" plan={plan} teamName={teamName ?? undefined}>
          {latestSummary ? (
            <>
              {/* Senaste AI-sammanfattning — prominently */}
              <div className="rounded-2xl border border-pitch/30 bg-pitch/5 p-6">
                <div className="flex items-center gap-2 mb-4">
                  <Sparkles className="w-4 h-4 text-pitch" />
                  <span className="text-xs font-semibold text-pitch uppercase tracking-widest">
                    Athopia AI
                  </span>
                  <span className="text-xs text-muted-foreground ml-auto">
                    {new Date(latestSummary.publishedAt ?? "").toLocaleDateString("sv-SE", {
                      day: "numeric",
                      month: "long",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </div>
                <h3 className="font-semibold text-2xl text-foreground mb-4">
                  {latestSummary.title}
                </h3>
                <div className="text-sm text-foreground leading-relaxed whitespace-pre-line">
                  {latestSummary.content ?? latestSummary.summary}
                </div>
              </div>

              {/* Äldre sammanfattningar */}
              {aiSummaries.slice(1).map((article) => (
                <div
                  key={article.id}
                  className="rounded-2xl border border-border bg-card p-5"
                >
                  <div className="flex items-center gap-2 mb-2">
                    <Sparkles className="w-3 h-3 text-pitch" />
                    <span className="text-xs text-muted-foreground">
                      {new Date(article.publishedAt ?? "").toLocaleDateString("sv-SE", {
                        day: "numeric",
                        month: "short",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>
                  <p className="text-sm font-medium text-foreground mb-2">{article.title}</p>
                  <p className="text-sm text-muted-foreground line-clamp-3">
                    {article.summary ?? article.content?.slice(0, 200)}
                  </p>
                </div>
              ))}
            </>
          ) : (
            <div className="rounded-2xl border border-border bg-card p-10 flex flex-col items-center gap-4 text-center">
              <div className="w-14 h-14 rounded-full bg-pitch/10 flex items-center justify-center">
                <Sparkles className="w-7 h-7 text-pitch" />
              </div>
              <div>
                <p className="font-semibold text-xl text-foreground mb-2">
                  Sammanfattning genereras
                </p>
                <p className="text-sm text-muted-foreground max-w-sm">
                  Athopia AI genererar en sammanfattning av {teamName} var 6:e timme.
                  Kom tillbaka om lite.
                </p>
              </div>
            </div>
          )}
          </PaywallGate>
        </div>

        {/* Höger: Narrativ */}
        <aside>
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="w-4 h-4 text-muted-foreground" />
            <h3 className="font-semibold text-lg text-foreground">AKTIVA NARRATIV</h3>
          </div>
          {narratives.length === 0 ? (
            <p className="text-sm text-muted-foreground">Inga aktiva narrativ för {teamName}.</p>
          ) : (
            <div className="flex flex-col gap-3">
              {narratives.map((n) => (
                <NarrativeCard key={n.id} narrative={n} />
              ))}
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}
