import type { Metadata } from "next";
import Link from "next/link";
import { MessageSquare, Pin, Lock, Plus, Brain } from "lucide-react";
import { createServerClient, isSupabaseConfigured } from "@/lib/supabase";
import type { ForumThread } from "@/lib/types";
import { currentUser } from "@clerk/nextjs/server";

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

type SortMode = "hot" | "latest" | "pinned";

async function getTeamId(slug: string): Promise<string | null> {
  if (!isSupabaseConfigured()) return null;
  try {
    const supabase = createServerClient();
    const { data } = await supabase
      .from("entities")
      .select("id")
      .eq("slug", slug)
      .eq("type", "team")
      .maybeSingle();
    return data?.id ?? null;
  } catch {
    return null;
  }
}

async function getThreads(teamId: string, sort: SortMode): Promise<ForumThread[]> {
  if (!isSupabaseConfigured()) return [];
  try {
    const supabase = createServerClient();
    let q = supabase.from("forum_threads").select("*").eq("team_id", teamId);

    if (sort === "pinned") {
      q = q.eq("pinned", true).order("created_at", { ascending: false });
    } else if (sort === "hot") {
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

async function getAISummary(teamId: string): Promise<string | null> {
  if (!isSupabaseConfigured()) return null;
  try {
    const supabase = createServerClient();
    const oneHourAgo = new Date(Date.now() - 3600 * 1000).toISOString();
    const { data } = await supabase
      .from("content_queue")
      .select("meta")
      .eq("status", "done")
      .gte("created_at", oneHourAgo)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    return (data?.meta as any)?.summary ?? null;
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
  return {
    title: `Forum — ${teamSlug} | Athopia`,
    description: `Diskutera ${teamSlug} med andra supportrar på Athopia.`,
  };
}

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "just nu";
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h`;
  return `${Math.floor(h / 24)}d`;
}

export default async function ForumTeamPage({
  params,
  searchParams,
}: {
  params: Promise<{ teamSlug: string }>;
  searchParams: Promise<{ sort?: string }>;
}) {
  const { teamSlug } = await params;
  const { sort = "latest" } = await searchParams;
  const validSort: SortMode = (["hot", "latest", "pinned"] as SortMode[]).includes(sort as SortMode)
    ? (sort as SortMode)
    : "latest";

  const [teamId, user] = await Promise.all([getTeamId(teamSlug), currentUser()]);
  const [threads, aiSummary] = await Promise.all([
    teamId ? getThreads(teamId, validSort) : Promise.resolve<ForumThread[]>([]),
    teamId ? getAISummary(teamId) : Promise.resolve<string | null>(null),
  ]);

  const base = `/forum/${teamSlug}`;

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
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

      {/* AI-summering-box */}
      {aiSummary && (
        <div className="relative overflow-hidden rounded-xl border border-amber-500/30 bg-amber-500/5 p-4 mb-6">
          <div className="flex items-start gap-3">
            <Brain className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-semibold text-amber-500 uppercase tracking-wide mb-1">
                AI-summering · senaste timmen
              </p>
              <p className="text-sm text-foreground/90 leading-relaxed">{aiSummary}</p>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h1 className="font-heading text-3xl text-foreground">
          {teamSlug.replace(/-/g, " ").toUpperCase()}
        </h1>
        {user ? (
          <Link
            href={`/lag/${teamSlug}/forum/ny`}
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
        {(["hot", "latest", "pinned"] as const).map((s) => (
          <Link
            key={s}
            href={`${base}?sort=${s}`}
            className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${
              validSort === s
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {s === "hot" ? "Hetast" : s === "latest" ? "Senaste" : "Pinnade"}
          </Link>
        ))}
      </div>

      {/* Thread list */}
      {threads.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <MessageSquare className="w-10 h-10 mx-auto mb-3 opacity-30" />
          <p className="text-sm">Inga trådar ännu. Starta en diskussion!</p>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {threads.map((thread) => (
            <Link
              key={thread.id}
              href={`/lag/${teamSlug}/forum/${thread.id}`}
              className="group flex items-start gap-4 bg-card hover:bg-card/80 border border-border rounded-lg p-4 transition-colors"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  {thread.pinned && <Pin className="w-3.5 h-3.5 text-pitch shrink-0" />}
                  {thread.locked && <Lock className="w-3.5 h-3.5 text-muted-foreground shrink-0" />}
                  <span className="font-medium text-foreground group-hover:text-pitch transition-colors truncate">
                    {thread.title}
                  </span>
                </div>
                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                  <span>{thread.author_name}</span>
                  <span>·</span>
                  <span>{timeAgo(thread.created_at)}</span>
                  {thread.view_count > 0 && (
                    <>
                      <span>·</span>
                      <span>{thread.view_count} visningar</span>
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

      {/* Länk tillbaka till lag-forumet */}
      <div className="mt-8 pt-6 border-t border-border">
        <Link
          href={`/lag/${teamSlug}/forum`}
          className="text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          Gå till lag-hubben →
        </Link>
      </div>
    </div>
  );
}
