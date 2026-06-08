import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { createServerClient, isSupabaseConfigured } from "@/lib/supabase";
import type { ForumPost } from "@/lib/types";
import ThreadClient from "./ThreadClient";

export const revalidate = 30;

async function getPost(postId: string): Promise<ForumPost | null> {
  if (!isSupabaseConfigured()) return null;
  try {
    const supabase = createServerClient();
    const { data } = await supabase
      .from("forum_posts")
      .select("*")
      .eq("id", postId)
      .eq("status", "published")
      .maybeSingle();
    return (data as ForumPost) ?? null;
  } catch {
    return null;
  }
}

async function getReplies(rootId: string): Promise<ForumPost[]> {
  if (!isSupabaseConfigured()) return [];
  try {
    const supabase = createServerClient();
    const { data } = await supabase
      .from("forum_posts")
      .select("*")
      .eq("root_id", rootId)
      .eq("status", "published")
      .order("created_at", { ascending: true })
      .limit(100);
    return (data as ForumPost[]) ?? [];
  } catch {
    return [];
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ teamSlug: string; postId: string }>;
}): Promise<Metadata> {
  const { postId, teamSlug } = await params;
  const post = await getPost(postId);
  return {
    title: post
      ? `${post.author_name}: ${post.content.slice(0, 60)}… | Athopia Forum`
      : `Tråd | Athopia Forum`,
    description: `${teamSlug} forum på Athopia`,
  };
}

export default async function ThreadPage({
  params,
}: {
  params: Promise<{ teamSlug: string; postId: string }>;
}) {
  const { teamSlug, postId } = await params;
  const [root, replies] = await Promise.all([getPost(postId), getReplies(postId)]);

  if (!root) notFound();

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-6">
      <Link
        href={`/forum/${teamSlug}`}
        className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6"
      >
        <ChevronLeft className="w-4 h-4" />
        Tillbaka till forumet
      </Link>

      <ThreadClient
        root={root}
        replies={replies}
        teamSlug={teamSlug}
        sport={root.sport ?? "football"}
      />
    </div>
  );
}
