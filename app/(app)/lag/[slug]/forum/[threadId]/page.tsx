import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Lock } from "lucide-react";
import { createServerClient, isSupabaseConfigured } from "@/lib/supabase";
import type { ForumThread, ForumReply } from "@/lib/types";
import { currentUser } from "@clerk/nextjs/server";
import { ReplySection } from "./ReplySection";

async function getThread(threadId: string): Promise<ForumThread | null> {
  if (!isSupabaseConfigured()) return null;
  try {
    const supabase = createServerClient();

    // Öka view_count
    await supabase
      .from("forum_threads")
      .update({ view_count: supabase.rpc("view_count + 1" as never) })
      .eq("id", threadId);

    const { data } = await supabase
      .from("forum_threads")
      .select("*")
      .eq("id", threadId)
      .single();
    return data as ForumThread | null;
  } catch {
    return null;
  }
}

async function getReplies(threadId: string): Promise<ForumReply[]> {
  if (!isSupabaseConfigured()) return [];
  try {
    const supabase = createServerClient();
    const { data } = await supabase
      .from("forum_replies")
      .select("*")
      .eq("thread_id", threadId)
      .order("created_at", { ascending: true })
      .limit(500);
    return (data as ForumReply[]) ?? [];
  } catch {
    return [];
  }
}

export const dynamic = 'force-dynamic';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string; threadId: string }>;
}): Promise<Metadata> {
  const { threadId } = await params;
  if (!isSupabaseConfigured()) return { title: "Forum | Athopia" };
  try {
    const supabase = createServerClient();
    const { data } = await supabase
      .from("forum_threads")
      .select("title")
      .eq("id", threadId)
      .single();
    return {
      title: data?.title ? `${data.title} | Forum | Athopia` : "Forum | Athopia",
    };
  } catch {
    return { title: "Forum | Athopia" };
  }
}

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "just nu";
  if (m < 60) return `${m}m sedan`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h sedan`;
  return new Date(iso).toLocaleDateString("sv-SE", { day: "numeric", month: "short" });
}

export default async function ThreadPage({
  params,
}: {
  params: Promise<{ slug: string; threadId: string }>;
}) {
  const { slug, threadId } = await params;
  const [thread, replies, user] = await Promise.all([
    getThread(threadId),
    getReplies(threadId),
    currentUser(),
  ]);

  if (!thread) notFound();

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
      {/* OP */}
      <div className="bg-card border border-border rounded-xl p-6 mb-6">
        <div className="flex items-start justify-between gap-4 mb-4">
          <h1 className="font-heading text-2xl text-foreground leading-tight">
            {thread.title}
          </h1>
          {thread.locked && (
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground bg-muted px-2 py-1 rounded-full shrink-0">
              <Lock className="w-3 h-3" />
              Låst
            </div>
          )}
        </div>
        <p className="text-foreground/90 whitespace-pre-wrap text-sm leading-relaxed mb-4">
          {thread.content}
        </p>
        <div className="flex items-center gap-2 text-xs text-muted-foreground border-t border-border pt-3">
          <span className="font-medium text-foreground">{thread.author_name}</span>
          <span>·</span>
          <span>{timeAgo(thread.created_at)}</span>
          <span>·</span>
          <span>{thread.view_count} visningar</span>
        </div>
      </div>

      {/* Svar */}
      {replies.length > 0 && (
        <div className="flex flex-col gap-3 mb-6">
          <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
            {replies.length} {replies.length === 1 ? "svar" : "svar"}
          </h2>
          {replies.map((reply) => (
            <div key={reply.id} className="bg-card border border-border rounded-lg p-4">
              <p className="text-sm text-foreground/90 whitespace-pre-wrap leading-relaxed mb-3">
                {reply.content}
              </p>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <span className="font-medium text-foreground">{reply.author_name}</span>
                <span>·</span>
                <span>{timeAgo(reply.created_at)}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Svarsformulär */}
      <ReplySection
        threadId={threadId}
        slug={slug}
        locked={thread.locked}
        user={user ? { id: user.id, name: user.fullName ?? user.username ?? "Anonym" } : null}
      />
    </div>
  );
}
