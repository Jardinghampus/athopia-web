import type { Metadata } from "next";
import { NarrativeCard } from "@/components/ui/NarrativeCard";
import { createServerClient, isSupabaseConfigured } from "@/lib/supabase";
import type { Narrative, Entity } from "@/lib/types";
import { Sparkles, TrendingUp } from "lucide-react";

export const revalidate = 60;

function mapNarrative(row: any): Narrative {
  return {
    id: String(row.id),
    topic: String(row.topic ?? ""),
    score: typeof row.score === "number" ? row.score : 0,
    sourceCount: Number(row.source_count ?? 0),
    trend: (row.trend ?? "stable") as Narrative["trend"],
    sentimentScore: row.sentiment_score ?? null,
    entities: Array.isArray(row.entities)
      ? row.entities.map((e: any): Entity => ({
          id: String(e.id ?? e.slug ?? ""),
          name: String(e.name ?? ""),
          type: (e.type ?? "team") as Entity["type"],
          slug: String(e.slug ?? ""),
          imageUrl: e.image_url ?? null,
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
    return data?.name ?? slug;
  } catch {
    return slug;
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
      .limit(10);
    return (data ?? []).map(mapNarrative);
  } catch {
    return [];
  }
}

async function getTeamDigest(teamName: string): Promise<string | null> {
  if (!isSupabaseConfigured()) return null;
  try {
    const supabase = createServerClient();
    const { data } = await supabase
      .from("agent_memory")
      .select("value")
      .ilike("key", `%${teamName.toLowerCase()}%digest%`)
      .maybeSingle();
    return (data as any)?.value ?? null;
  } catch {
    return null;
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
    title: `${name} — AI-sammanfattning`,
    description: `AI-genererad sammanfattning av ${name}s säsong och narrativ på Athopia.`,
  };
}

export default async function LagSammanfattningPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const teamName = await getTeamName(slug);
  const [narratives, digest] = await Promise.all([
    getTeamNarratives(teamName),
    getTeamDigest(teamName),
  ]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
      <h2 className="font-heading text-3xl text-foreground mb-6">
        AI-SAMMANFATTNING — {teamName.toUpperCase()}
      </h2>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-8">
        {/* AI-digest */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-xs text-muted-foreground uppercase tracking-wide">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Genererad av Echo</span>
          </div>

          {digest ? (
            <div className="rounded-2xl border border-border bg-card p-6">
              <p className="text-sm text-foreground leading-relaxed whitespace-pre-line">{digest}</p>
            </div>
          ) : (
            <div className="rounded-2xl border border-border bg-card p-8 flex flex-col items-center gap-4 text-center">
              <div className="w-12 h-12 rounded-full bg-pitch/10 flex items-center justify-center">
                <Sparkles className="w-6 h-6 text-pitch" />
              </div>
              <div>
                <p className="font-medium text-foreground mb-1">AI-digest genereras automatiskt</p>
                <p className="text-sm text-muted-foreground">
                  Echo-agenten bygger en sammanfattning av {teamName}s säsong baserat på artiklar,
                  matcher och narrativ. Kom tillbaka snart.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Narrativ */}
        <aside>
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="w-4 h-4 text-muted-foreground" />
            <h3 className="font-heading text-lg text-foreground">AKTIVA NARRATIV</h3>
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
