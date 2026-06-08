import type { Metadata } from "next";
import Link from "next/link";
import { createServerClient, isSupabaseConfigured } from "@/lib/supabase";
import type { ForumPost } from "@/lib/types";
import ForumSummaryBar from "@/components/forum/ForumSummaryBar";
import ForumClient from "./ForumClient";

export const revalidate = 60;

const ALL_TEAMS = [
  { name: "AIK", slug: "aik" },
  { name: "DIF", slug: "djurgardens-if" },
  { name: "MFF", slug: "malmoe-ff" },
  { name: "HIF", slug: "helsingborgs-if" },
  { name: "IFK Gborg", slug: "ifk-goeteborg" },
  { name: "Häcken", slug: "bk-haecken" },
  { name: "Hammarby", slug: "hammarby-if" },
  { name: "Sirius", slug: "ik-sirius" },
  { name: "Kalmar", slug: "kalmar-ff" },
  { name: "Elfsborg", slug: "if-elfsborg" },
  { name: "Örebro", slug: "orebro-sk" },
  { name: "Norrköping", slug: "ifk-norrkoping" },
  { name: "Sundsvall", slug: "gif-sundsvall" },
  { name: "Mjällby", slug: "mjallby-aif" },
  { name: "Värnamo", slug: "ik-varnamo" },
  { name: "Halmstad", slug: "halmstads-bk" },
];

async function getPosts(teamSlug: string, sort: string): Promise<ForumPost[]> {
  if (!isSupabaseConfigured()) return [];
  try {
    const supabase = createServerClient();
    let q = supabase
      .from("forum_posts")
      .select("*")
      .eq("team_slug", teamSlug)
      .eq("sport", "football")
      .eq("status", "published")
      .is("parent_id", null);

    if (sort === "hot") {
      q = q.order("hot_score", { ascending: false });
    } else {
      q = q.order("created_at", { ascending: false });
    }

    const { data } = await q.limit(50);
    return (data as ForumPost[]) ?? [];
  } catch {
    return [];
  }
}

async function getAISummary(teamSlug: string): Promise<string | null> {
  if (!isSupabaseConfigured()) return null;
  try {
    const supabase = createServerClient();
    const { data } = await supabase
      .from("agent_memory")
      .select("content")
      .eq("agent_id", "forum-summarizer")
      .eq("category", "forum_summary")
      .contains("tags", [teamSlug])
      .order("updated_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    return (data as any)?.content ?? null;
  } catch {
    return null;
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ teamSlug: string }>;
}): Promise<Metadata> {
  const { teamSlug } = await params;
  const name = ALL_TEAMS.find((t) => t.slug === teamSlug)?.name ?? teamSlug;
  return {
    title: `${name} Forum | Athopia`,
    description: `Diskutera ${name} med andra supportrar på Athopia.`,
  };
}

export default async function ForumTeamPage({
  params,
  searchParams,
}: {
  params: Promise<{ teamSlug: string }>;
  searchParams: Promise<{ sort?: string }>;
}) {
  const { teamSlug } = await params;
  const { sort = "hot" } = await searchParams;
  const validSort = ["hot", "latest", "transfers", "taktik", "match"].includes(sort) ? sort : "hot";

  const [posts, aiSummary] = await Promise.all([
    getPosts(teamSlug, validSort),
    getAISummary(teamSlug),
  ]);

  const teamName = ALL_TEAMS.find((t) => t.slug === teamSlug)?.name ?? teamSlug.replace(/-/g, " ").toUpperCase();

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-6">
      {/* Lag-tabs */}
      <div className="flex gap-1.5 overflow-x-auto scrollbar-none mb-6 pb-1">
        {ALL_TEAMS.map((t) => (
          <Link
            key={t.slug}
            href={`/forum/${t.slug}`}
            className={`shrink-0 px-3 py-1 rounded-full text-xs font-medium border transition-colors ${
              t.slug === teamSlug
                ? "bg-pitch text-white border-pitch"
                : "border-border/60 text-muted-foreground hover:border-pitch hover:text-pitch"
            }`}
          >
            {t.name}
          </Link>
        ))}
      </div>

      <h1 className="font-heading text-2xl text-foreground mb-4">
        {teamName}
      </h1>

      {aiSummary && <ForumSummaryBar summary={aiSummary} />}

      <ForumClient
        teamSlug={teamSlug}
        sport="football"
        initialPosts={posts}
        initialSort={validSort}
      />
    </div>
  );
}
