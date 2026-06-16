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
    return (data as any as Narrative) ?? null;
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
      <div className="flex items-center gap-3 mb-6">
        <TrendBadge trend={narrative.trend} />
        <span className="text-sm text-muted-foreground">{Math.round(narrative.score * 100)}%</span>
      </div>

      <Separator className="mb-6" />

      {typeof narrative.sentimentScore === "number" && (
        <div className="rounded-2xl border border-border bg-card p-5 mb-6">
          <div className="text-sm text-muted-foreground mb-3">Sentiment</div>
          <SentimentBar score={narrative.sentimentScore} />
        </div>
      )}

      <div className="rounded-2xl border border-border bg-card p-6">
        <p className="text-muted-foreground">
          Källöversikt, tidslinje och relaterat innehåll kopplas in när Athopia OS-pipeline levererar fulla narrativ-historiker.
        </p>
      </div>
    </div>
  );
}

