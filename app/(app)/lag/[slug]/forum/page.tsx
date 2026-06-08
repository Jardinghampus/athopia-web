import type { Metadata } from "next";
import Link from "next/link";
import { MessageSquare, Pin, Lock, Plus } from "lucide-react";
import { createServerClient, isSupabaseConfigured } from "@/lib/supabase";
import type { ForumThread } from "@/lib/types";
import { currentUser } from "@clerk/nextjs/server";

export const dynamic = 'force-dynamic';

async function getTeamId(slug: string): Promise<string | null> {
  if (!isSupabaseConfigured()) return null;
  try {
    const supabase = createServerClient();
    const { data } = await supabase
      .from("entities")
      .select("id")
      .eq("slug", slug)
      .eq("type", "team")
      .single();
    return data?.id ?? null;
  } catch {
    return null;
  }
}

async function getThreads(
  teamId: string,
  sort: "latest" | "popular" | "pinned"
): Promise<ForumThread[]> {
  if (!isSupabaseConfigured()) return [];
  try {
    const supabase = createServerClient();
    let q = supabase
      .from("forum_threads")
      .select("*")
      .eq("team_id", teamId);

    if (sort === "pinned") {
      q = q.eq("pinned", true).order("created_at", { ascending: false });
    } else if (sort === "popular") {
      q = q.order("reply_count", { ascending: false }).order("view_count", { ascending: false });
    } else {
      q = q.order("pinned", { ascending: false }).order("last_reply_at", { ascending: false });
    }

    const { data } = await q.limit(50);
    return (data as ForumThread[]) ?? [];
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
  return {
    title: `Forum — ${slug} | Athopia`,
    description: `Diskutera ${slug} med andra supportrar på Athopia.`,
  };
}

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "just nu";
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h`;
  const d = Math.floor(h / 24);
  return `${d}d`;
}

export default async function ForumPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ sort?: string }>;
}) {
  const { slug } = await params;
  const { sort = "latest" } = await searchParams;
  const validSort = (["latest", "popular", "pinned"] as const).includes(
    sort as "latest" | "popular" | "pinned"
  )
    ? (sort as "latest" | "popular" | "pinned")
    : "latest";

  const [teamId, user] = await Promise.all([getTeamId(slug), currentUser()]);
  const threads = teamId ? await getThreads(teamId, validSort) : [];

  const base = `/lag/${slug}/forum`;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-heading text-3xl text-foreground">FORUM</h1>
        {user ? (
          <Link
            href={`${base}/ny`}
            className="flex items-center gap-2 bg-pitch text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-pitch/90 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Ny tråd
          </Link>
        ) : (
          <Link
            href="/sign-in"
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            Logga in för att posta
          </Link>
        )}
      </div>

      {/* Sort-tabs */}
      <div className="flex gap-1 mb-6 bg-card rounded-lg p-1 w-fit">
        {(["latest", "popular", "pinned"] as const).map((s) => (
          <Link
            key={s}
            href={`${base}?sort=${s}`}
            className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${
              validSort === s
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {s === "latest" ? "Senaste" : s === "popular" ? "Populärast" : "Pinnade"}
          </Link>
        ))}
      </div>

      {/* Thread list */}
      {threads.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <MessageSquare className="w-10 h-10 mx-auto mb-3 opacity-30" />
          <p className="text-sm">Inga trådar ännu. Var först med att starta en diskussion!</p>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {threads.map((thread) => (
            <Link
              key={thread.id}
              href={`${base}/${thread.id}`}
              className="group flex items-start gap-4 bg-card hover:bg-card/80 border border-border rounded-lg p-4 transition-colors"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  {thread.pinned && (
                    <Pin className="w-3.5 h-3.5 text-pitch shrink-0" />
                  )}
                  {thread.locked && (
                    <Lock className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                  )}
                  <span className="font-medium text-foreground group-hover:text-pitch transition-colors truncate">
                    {thread.title}
                  </span>
                </div>
                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                  <span>{thread.author_name}</span>
                  <span>·</span>
                  <span>{timeAgo(thread.created_at)}</span>
                  {thread.reply_count > 0 && (
                    <>
                      <span>·</span>
                      <span>Senast {timeAgo(thread.last_reply_at)}</span>
                    </>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-1 text-xs text-muted-foreground shrink-0">
                <MessageSquare className="w-3.5 h-3.5" />
                <span>{thread.reply_count}</span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
