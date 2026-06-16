import type { Metadata } from "next";
import Link from "next/link";
import { createServerClient, isSupabaseConfigured, getEntities } from "@/lib/supabase";
import type { ForumPost } from "@/lib/types";
import ForumSummaryBar from "@/components/forum/ForumSummaryBar";
import ForumDailySummary from "@/components/forum/ForumDailySummary";
import ForumClient from "./ForumClient";

export const dynamic = 'force-dynamic';

const DIF_MOCK_POSTS: ForumPost[] = [
  {
    id: "mock-1",
    content: "Vilken match igår! Isaks header i 89:an var rent gudomlig. Vi förtjänade verkligen de tre poängen mot Hammarby. ALDRIG KAPITULERA 💙💛",
    images: [],
    parent_id: null,
    root_id: null,
    quoted_post_id: null,
    depth: 0,
    author_id: "user-mock-1",
    author_name: "Erik Lindqvist",
    author_avatar: null,
    sport: "football",
    team_slug: "djurgardens-if",
    like_count: 47,
    reply_count: 12,
    repost_count: 8,
    view_count: 340,
    ai_summary: null,
    pinned: true,
    hot_score: 0.95,
    status: "published",
    created_at: new Date(Date.now() - 1000 * 60 * 38).toISOString(),
    replies: [
      {
        id: "mock-1-reply-1",
        content: "Håller med! Och Brorsson håller nollan för tredje matchen i rad. Defensiven är stenhård nu.",
        images: [],
        parent_id: "mock-1",
        root_id: "mock-1",
        quoted_post_id: null,
        depth: 1,
        author_id: "user-mock-4",
        author_name: "Sara Bergman",
        author_avatar: null,
        sport: "football",
        team_slug: "djurgardens-if",
        like_count: 19,
        reply_count: 0,
        repost_count: 2,
        view_count: 89,
        ai_summary: null,
        pinned: false,
        hot_score: 0.62,
        status: "published",
        created_at: new Date(Date.now() - 1000 * 60 * 22).toISOString(),
      },
    ],
  },
  {
    id: "mock-2",
    content: "Läste precis att Klaesson är aktuell för en flytt till Premier League i januari. Hoppas vi kan hålla kvar honom till säsongsslut åtminstone. Vad tror ni?",
    images: [],
    parent_id: null,
    root_id: null,
    quoted_post_id: null,
    depth: 0,
    author_id: "user-mock-2",
    author_name: "Johan Ström",
    author_avatar: null,
    sport: "football",
    team_slug: "djurgardens-if",
    like_count: 31,
    reply_count: 7,
    repost_count: 5,
    view_count: 218,
    ai_summary: null,
    pinned: false,
    hot_score: 0.82,
    status: "published",
    created_at: new Date(Date.now() - 1000 * 60 * 95).toISOString(),
  },
  {
    id: "mock-3",
    content: "Taktiken mot Häcken förra veckan var lite konstig. Varför spelade vi med en så hög linje mot deras kontringar? Kim Bergström verkar inte ha hittat rätt formation ännu den här säsongen.",
    images: [],
    parent_id: null,
    root_id: null,
    quoted_post_id: null,
    depth: 0,
    author_id: "user-mock-3",
    author_name: "Maja Nilsson",
    author_avatar: null,
    sport: "football",
    team_slug: "djurgardens-if",
    like_count: 14,
    reply_count: 21,
    repost_count: 1,
    view_count: 175,
    ai_summary: null,
    pinned: false,
    hot_score: 0.74,
    status: "published",
    created_at: new Date(Date.now() - 1000 * 60 * 210).toISOString(),
  },
  {
    id: "mock-4",
    content: "Inför söndagens match mot Sirius: tror ni vi kör 4-3-3 eller 4-2-3-1? Hoppas Radetinac får starta från start, han var bäste man från bänken senast.",
    images: [],
    parent_id: null,
    root_id: null,
    quoted_post_id: null,
    depth: 0,
    author_id: "user-mock-5",
    author_name: "Anders Holmgren",
    author_avatar: null,
    sport: "football",
    team_slug: "djurgardens-if",
    like_count: 9,
    reply_count: 4,
    repost_count: 0,
    view_count: 88,
    ai_summary: null,
    pinned: false,
    hot_score: 0.51,
    status: "published",
    created_at: new Date(Date.now() - 1000 * 60 * 320).toISOString(),
  },
];

const DIF_DAILY_SUMMARY = {
  summary:
    "Djurgårdens forum har haft ett intensivt dygn med fokus på segern mot Hammarby (1–0) och Isaks avgörande header i matchminut 89. Rykten om ett Premier League-intresse för målvakten Klaesson skapar oro bland supportrarna. Taktikdebatten kring den höga försvarslinjen fortsätter, och inför söndagens möte med Sirius spekuleras det friskt om startuppställningen.",
  topics: [
    { label: "Derby-segern", count: 34, trend: "hot" as const },
    { label: "Klaesson-rykten", count: 18, trend: "rising" as const },
    { label: "Taktik", count: 21, trend: "rising" as const },
    { label: "Inför Sirius", count: 9, trend: "normal" as const },
    { label: "Brorsson", count: 7, trend: "normal" as const },
  ],
  postCount: 89,
  activeUsers: 42,
  generatedAt: "idag 08:00",
};

async function getPosts(teamSlug: string, sort: string): Promise<ForumPost[]> {
  if (!isSupabaseConfigured()) return teamSlug === "djurgardens-if" ? DIF_MOCK_POSTS : [];
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
    const posts = (data as ForumPost[]) ?? [];
    if (posts.length === 0 && teamSlug === "djurgardens-if") return DIF_MOCK_POSTS;
    return posts;
  } catch {
    if (teamSlug === "djurgardens-if") return DIF_MOCK_POSTS;
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
      .eq("category", `forum_summary_${teamSlug}`)
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
  const teams = await getEntities("team");
  const name = teams.find((t) => t.slug === teamSlug)?.name ?? teamSlug;
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

  const [posts, aiSummary, allTeams] = await Promise.all([
    getPosts(teamSlug, validSort),
    getAISummary(teamSlug),
    getEntities("team"),
  ]);

  const teamName = allTeams.find((t) => t.slug === teamSlug)?.name ?? teamSlug.replace(/-/g, " ").toUpperCase();

  return (
    <div className="w-full px-6 sm:px-8 py-6">
      {/* Lag-tabs */}
      <div className="flex gap-1.5 overflow-x-auto scrollbar-none mb-6 pb-1">
        {allTeams.map((t) => (
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

      <h1 className="font-semibold text-2xl text-foreground mb-4">
        {teamName}
      </h1>

      {aiSummary && <ForumSummaryBar summary={aiSummary} />}

      {teamSlug === "djurgardens-if" && (
        <ForumDailySummary
          teamName="Djurgårdens IF"
          summary={DIF_DAILY_SUMMARY.summary}
          topics={DIF_DAILY_SUMMARY.topics}
          postCount={DIF_DAILY_SUMMARY.postCount}
          activeUsers={DIF_DAILY_SUMMARY.activeUsers}
          generatedAt={DIF_DAILY_SUMMARY.generatedAt}
        />
      )}

      <ForumClient
        teamSlug={teamSlug}
        sport="football"
        initialPosts={posts}
        initialSort={validSort}
      />
    </div>
  );
}
