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
import ForumRightSidebar from "@/components/forum/ForumRightSidebar";

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


async function getPosts(teamSlug: string): Promise<ForumPost[]> {
  if (!isSupabaseConfigured()) return [];
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
  searchParams,
}: {
  params: Promise<{ teamSlug: string }>;
  searchParams: Promise<{ artikel?: string }>;
}) {
  const { teamSlug } = await params;
  const { artikel } = await searchParams;

  // Artikel-länkad compose: /forum/<lag>?artikel=<id> öppnar composern förifylld
  let articlePrefill: { id: string; title: string; slug: string } | null = null;
  if (artikel && isSupabaseConfigured()) {
    try {
      const supabase = createServerClient();
      const { data } = await supabase
        .from("articles")
        .select("id, title, slug")
        .eq("id", artikel)
        .maybeSingle();
      if (data) articlePrefill = data as { id: string; title: string; slug: string };
    } catch {
      /* trasigt id → ingen prefill */
    }
  }

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

  const sidebarTeams = allsvenskanTeams.map(t => ({ slug: t.slug ?? "", name: t.name ?? "" }));

  return (
    <div className="w-full min-h-screen">
      {/* 3-col grid: left 20% | center 60% | right 20% — collapses to single on mobile */}
      <div className="mx-auto w-full max-w-7xl px-4 xl:px-6">
        <div className="flex gap-6 items-start">

          {/* Main feed column */}
          <div className="flex-1 min-w-0 border-x border-border/40">

            {/* Sticky header — offset by main Header height (h-12 = 3rem) */}
            <div className="sticky top-12 z-30 bg-background/90 backdrop-blur-xl border-b border-border/40 px-4 py-3 flex items-center gap-3">
              <Link
                href="/forum"
                className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-zinc-800/60 transition-colors shrink-0"
              >
                <ChevronLeft className="w-5 h-5 text-zinc-400" />
              </Link>
              <div className="flex-1 min-w-0">
                <h1 className="font-semibold text-[15px] text-white truncate">{teamName}</h1>
                <p className="text-[12px] text-muted-foreground">Community</p>
              </div>
              <TeamDropdown teams={sidebarTeams} currentSlug={teamSlug} />
              {clerkUser && <NotificationBell teamSlug={teamSlug} />}
            </div>

            <div className="pb-28">
              {/* AI summarizer */}
              {aiSummary && (
                <div className="px-4 pt-4">
                  <ForumSummaryBar summary={aiSummary} />
                </div>
              )}
              <div className="px-4 pt-4 pb-2">
                <CommunityGuidelines />
              </div>

              {/* Feed — no horizontal padding, posts use full-bleed border-b style */}
              <ForumClient
                teamSlug={teamSlug}
                sport="football"
                initialPosts={posts}
                articlePrefill={articlePrefill}
              />
            </div>
          </div>

          {/* Right sidebar — hidden on mobile/tablet */}
          <aside className="hidden lg:block w-[280px] shrink-0 sticky top-4 py-4 max-h-[calc(100vh-2rem)] overflow-y-auto">
            <ForumRightSidebar teamName={teamName} teamSlug={teamSlug} aiSummary={aiSummary} />
          </aside>

        </div>
      </div>
    </div>
  );
}
