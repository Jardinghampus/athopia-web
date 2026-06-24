import type { Metadata } from "next";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { currentUser } from "@clerk/nextjs/server";
import { createServerClient, isSupabaseConfigured, getEntities } from "@/lib/supabase";
import type { ForumPost } from "@/lib/types";
import ForumSummaryBar from "@/components/forum/ForumSummaryBar";
import ForumDailySummary from "@/components/forum/ForumDailySummary";
import CommunityGuidelines from "@/components/forum/CommunityGuidelines";
import TeamDropdown from "@/components/forum/TeamDropdown";
import NotificationBell from "@/components/forum/NotificationBell";
import ForumClient from "./ForumClient";

export const dynamic = "force-dynamic";

// Allsvenskan 2025 — slugs som förväntas finnas i entities
const ALLSVENSKAN_SLUGS = new Set([
  "aik",
  "bk-hacken",
  "djurgardens-if",
  "gais",
  "hammarby-if",
  "helsingborgs-if",
  "ifk-goteborg",
  "ifk-norrkoping",
  "ifk-varnamo",
  "if-elfsborg",
  "kalmar-ff",
  "malmo-ff",
  "mjallby-aif",
  "degerfors-if",
  "halmstads-bk",
  "vasteras-sk",
]);

const DIF_MOCK_POSTS: ForumPost[] = [
  {
    id: "mock-1",
    content:
      "Vilken match igår! Isaks header i 89:an var rent gudomlig. Vi förtjänade verkligen de tre poängen mot Hammarby. Derby-segrar smakar alltid extra gott, nu vidare mot Sirius på söndag. ALDRIG KAPITULERA 💙💛",
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
    label: "match",
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
    content:
      "Läste precis att Klaesson är aktuell för en flytt till Premier League i januari. Hoppas vi kan hålla kvar honom till säsongsslut åtminstone. Vad tror ni — säljer vi om budet är rätt?",
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
    label: "rykte",
    status: "published",
    created_at: new Date(Date.now() - 1000 * 60 * 95).toISOString(),
  },
  {
    id: "mock-3",
    content:
      "Taktiken mot Häcken förra veckan var lite konstig. Varför spelade vi med en så hög linje mot deras kontringar? Kim Bergström verkar inte ha hittat rätt formation ännu den här säsongen.",
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
    label: "taktik",
    status: "published",
    created_at: new Date(Date.now() - 1000 * 60 * 210).toISOString(),
  },
  {
    id: "mock-4",
    content:
      "Inför söndagens match mot Sirius: tror ni vi kör 4-3-3 eller 4-2-3-1? Hoppas Radetinac får starta, han var bäste man från bänken senast och förtjänar mer speltid.",
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
    label: "diskussion",
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

async function getPosts(teamSlug: string): Promise<ForumPost[]> {
  if (!isSupabaseConfigured())
    return teamSlug === "djurgardens-if" ? DIF_MOCK_POSTS : [];
  try {
    const supabase = createServerClient();
    const { data } = await supabase
      .from("forum_posts")
      .select("*")
      .eq("team_slug", teamSlug)
      .eq("sport", "football")
      .eq("status", "published")
      .is("parent_id", null)
      .order("hot_score", { ascending: false })
      .limit(50);
    const posts = (data as ForumPost[]) ?? [];
    if (posts.length === 0 && teamSlug === "djurgardens-if") return DIF_MOCK_POSTS;
    return posts;
  } catch {
    return teamSlug === "djurgardens-if" ? DIF_MOCK_POSTS : [];
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
    title: `${name} · Community | Athopia`,
    description: `Diskutera ${name} med andra supportrar på Athopia.`,
  };
}

export default async function ForumTeamPage({
  params,
}: {
  params: Promise<{ teamSlug: string }>;
}) {
  const { teamSlug } = await params;

  const [posts, aiSummary, allTeams, clerkUser] = await Promise.all([
    getPosts(teamSlug),
    getAISummary(teamSlug),
    getEntities("team"),
    currentUser(),
  ]);

  // Filter to Allsvenskan only
  const allsvenskanTeams = allTeams
    .filter((t) => ALLSVENSKAN_SLUGS.has(t.slug ?? ""))
    .sort((a, b) => (a.name ?? "").localeCompare(b.name ?? "", "sv"));

  const teamName =
    allsvenskanTeams.find((t) => t.slug === teamSlug)?.name ??
    teamSlug.replace(/-/g, " ").toUpperCase();

  return (
    <div className="w-full min-h-screen">
      <div className="mx-auto w-full max-w-[600px] border-x border-border/20">

        {/* Sticky header */}
        <div className="sticky top-0 z-30 bg-background/90 backdrop-blur-xl border-b border-border/25 px-4 py-3 flex items-center gap-3">
          <Link
            href="/forum"
            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-muted/60 transition-colors shrink-0"
          >
            <ChevronLeft className="w-5 h-5 text-muted-foreground" />
          </Link>
          <div className="flex-1 min-w-0">
            <h1 className="font-semibold text-base text-foreground truncate">{teamName}</h1>
            <p className="text-[11px] text-muted-foreground">Community</p>
          </div>
          <TeamDropdown teams={allsvenskanTeams.map(t => ({ slug: t.slug ?? "", name: t.name ?? "" }))} currentSlug={teamSlug} />
          {clerkUser && <NotificationBell teamSlug={teamSlug} />}
        </div>

        <div className="px-4 pt-5 pb-28 space-y-4">
          {/* AI summarizer */}
          {aiSummary && <ForumSummaryBar summary={aiSummary} />}
          {teamSlug === "djurgardens-if" && (
            <ForumDailySummary
              teamName={teamName}
              summary={DIF_DAILY_SUMMARY.summary}
              topics={DIF_DAILY_SUMMARY.topics}
              postCount={DIF_DAILY_SUMMARY.postCount}
              activeUsers={DIF_DAILY_SUMMARY.activeUsers}
              generatedAt={DIF_DAILY_SUMMARY.generatedAt}
            />
          )}

          {/* Community guidelines */}
          <CommunityGuidelines />

          {/* Feed */}
          <ForumClient
            teamSlug={teamSlug}
            sport="football"
            initialPosts={posts}
          />
        </div>
      </div>
    </div>
  );
}
