import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { createServerClient, isSupabaseConfigured } from "@/lib/supabase";
import type { ForumPost } from "@/lib/types";
import ThreadClient from "./ThreadClient";

export const dynamic = 'force-dynamic';

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
  } catch (error) {
    console.error("Failed to fetch post:", postId, error);
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
  } catch (error) {
    console.error("Failed to fetch replies:", rootId, error);
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
  const root = await getPost(postId);
  if (!root) notFound();

  const replies = await getReplies(root.root_id ?? root.id);

  return (
    <div className="w-full min-h-screen">
      <div className="mx-auto w-full max-w-[600px] border-x border-border/20">
        {/* Sticky top nav */}
        <div className="sticky top-0 z-30 bg-background/90 backdrop-blur-xl border-b border-border/30 px-4 py-3 flex items-center gap-3">
          <Link
            href={`/forum/${teamSlug}`}
            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-muted/60 transition-colors shrink-0"
          >
            <ChevronLeft className="w-5 h-5 text-muted-foreground" />
          </Link>
          <span className="font-semibold text-base text-foreground">Tråd</span>
        </div>

        <div className="px-4 pt-5 pb-28">
          <ThreadClient
            root={root}
            replies={replies}
            teamSlug={teamSlug}
            sport={root.sport ?? "football"}
          />
        </div>
      </div>
    </div>
  );
}
