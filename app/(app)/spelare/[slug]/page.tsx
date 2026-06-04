import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { createServerClient, isSupabaseConfigured } from "@/lib/supabase";
import type { Article } from "@/lib/types";
import { ArticleCard } from "@/components/ui/ArticleCard";
import { SentimentBar } from "@/components/ui/SentimentBar";
import { Separator } from "@/components/ui/separator";

export const revalidate = 60;

interface PlayerRow {
  id: string;
  name: string;
  slug: string;
  team_slug: string | null;
  position: string | null;
  age: number | null;
  sentiment: number | null;
}

async function getPlayer(slug: string): Promise<PlayerRow | null> {
  if (!isSupabaseConfigured()) return null;
  try {
    const supabase = createServerClient();
    const { data } = await supabase.from("players").select("*").eq("slug", slug).maybeSingle();
    return (data as any as PlayerRow) ?? null;
  } catch {
    return null;
  }
}

async function getCoverage(playerSlug: string): Promise<Article[]> {
  if (!isSupabaseConfigured()) return [];
  try {
    const supabase = createServerClient();
    const { data } = await supabase
      .from("articles")
      .select("*")
      .contains("entities", [{ slug: playerSlug, type: "player" }])
      .order("published_at", { ascending: false })
      .limit(10);
    return (data as any as Article[]) ?? [];
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
  const player = await getPlayer(slug);
  if (!player) return { title: "Spelare hittades inte" };
  return {
    title: player.name,
    description: `Statistik och nyheter om ${player.name} på Athopia.`,
  };
}

export default async function SpelarePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const player = await getPlayer(slug);
  if (!player) notFound();

  const coverage = await getCoverage(slug);

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10">
      <h1 className="font-heading text-5xl text-foreground mb-3">{player.name}</h1>
      <p className="text-muted-foreground mb-8">
        {player.position ?? "—"} {player.age ? `· ${player.age} år` : ""}{" "}
        {player.team_slug ? `· ${player.team_slug}` : ""}
      </p>

      {typeof player.sentiment === "number" && (
        <div className="rounded-2xl border border-border bg-card p-5 mb-8">
          <div className="text-sm text-muted-foreground mb-3">Sentiment</div>
          <SentimentBar score={player.sentiment} />
        </div>
      )}

      <Separator className="mb-6" />

      <section>
        <h2 className="font-heading text-2xl text-foreground mb-4">MEDIA COVERAGE</h2>
        {coverage.length === 0 ? (
          <p className="text-sm text-muted-foreground">Inga artiklar hittades just nu.</p>
        ) : (
          <div className="flex flex-col gap-3">
            {coverage.map((a) => (
              <ArticleCard key={a.id} article={a} size="sm" />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

