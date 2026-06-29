import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { createServerClient, isSupabaseConfigured } from "@/lib/supabase";
import type { Narrative } from "@/lib/types";
import { TrendBadge } from "@/components/ui/TrendBadge";
import { SentimentBar } from "@/components/ui/SentimentBar";
import { Separator } from "@/components/ui/separator";

export const dynamic = 'force-dynamic';

async function getNarrative(id: string): Promise<Narrative | null> {
  if (!isSupabaseConfigured()) return null;
  try {
    const supabase = createServerClient();
    const { data } = await supabase.from("narratives").select("*").eq("id", id).maybeSingle();
    if (!data) return null;
    const row = data as any;
    const score = Number(row.score ?? row.importance_score ?? 0);
    return {
      id: String(row.id),
      topic: String(row.topic ?? row.title ?? ""),
      score: Number.isFinite(score) ? score : 0,
      description: row.description ?? null,
      body: row.generated_text ?? null,
      sourceCount: Number(row.source_count ?? 0),
      trend: (row.trend ?? "stable") as Narrative["trend"],
      sentimentScore: row.sentiment_score ?? null,
      entities: [],
      createdAt: String(row.created_at ?? new Date().toISOString()),
      updatedAt: String(row.updated_at ?? row.last_updated_at ?? row.created_at ?? new Date().toISOString()),
    };
  } catch {
    return null;
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const narrative = await getNarrative(id);
  if (!narrative) return { title: "Narrativ hittades inte" };
  return {
    title: narrative.topic,
    description: `Vad pratas det om just nu? ${narrative.topic}`,
    openGraph: {
      title: `${narrative.topic} | Athopia`,
      description: `Narrativ med score ${Math.round(narrative.score * 100)}%`,
    },
  };
}

export default async function NarrativePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const narrative = await getNarrative(id);
  if (!narrative) notFound();

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10">
      <h1 className="font-bold text-5xl text-foreground mb-3">{narrative.topic}</h1>
      {narrative.description && (
        <p className="mb-6 max-w-3xl text-lg leading-8 text-muted-foreground">{narrative.description}</p>
      )}
      <div className="flex items-center gap-3 mb-6">
        <TrendBadge trend={narrative.trend} />
        <span className="text-sm text-muted-foreground">{Math.round(narrative.score * 100)}%</span>
        <span className="text-sm text-muted-foreground">{narrative.sourceCount} källor</span>
      </div>

      <Separator className="mb-6" />

      {typeof narrative.sentimentScore === "number" && (
        <div className="rounded-2xl border border-border bg-card p-5 mb-6">
          <div className="text-sm text-muted-foreground mb-3">Sentiment</div>
          <SentimentBar score={narrative.sentimentScore} />
        </div>
      )}

      {narrative.body ? (
        <article className="prose prose-invert max-w-none text-foreground">
          {narrative.body.split("\n\n").map((paragraph) => (
            <p key={paragraph.slice(0, 80)} className="text-base leading-8 text-foreground/90">
              {paragraph}
            </p>
          ))}
        </article>
      ) : (
        <p className="text-muted-foreground">
          Källöversikt, tidslinje och relaterat innehåll kopplas in när Athopia OS-pipeline levererar fulla narrativ-historiker.
        </p>
      )}
    </div>
  );
}
