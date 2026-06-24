"use client";

import { useState, useEffect, useCallback } from "react";
import { Plus } from "lucide-react";
import { motion } from "motion/react";
import { useUser } from "@clerk/nextjs";
import PostItem from "@/components/forum/PostItem";
import ComposeDrawer from "@/components/forum/ComposeDrawer";
import TagFilter from "@/components/forum/TagFilter";
import type { ForumPost } from "@/lib/types";

interface Props {
  teamSlug: string;
  sport: string;
  initialPosts: ForumPost[];
  initialSort: string;
}

export default function ForumClient({ teamSlug, sport, initialPosts, initialSort }: Props) {
  const { user } = useUser();
  const [posts, setPosts] = useState<ForumPost[]>(initialPosts);
  const [sort, setSort] = useState(initialSort);
  const [composeOpen, setComposeOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const fetchPosts = useCallback(async (s: string) => {
    setLoading(true);
    try {
      const res = await fetch(
        `/api/forum/posts?teamSlug=${teamSlug}&sport=${sport}&sort=${s}`
      );
      if (!res.ok) {
        setPosts([]);
        return;
      }
      const json = (await res.json()) as { posts: ForumPost[] };
      setPosts(json.posts ?? []);
    } catch {
      setPosts([]);
    } finally {
      setLoading(false);
    }
  }, [teamSlug, sport]);

  useEffect(() => {
    fetchPosts(sort);
  }, [sort, fetchPosts]);

  async function handlePost(data: {
    content: string;
    parentId?: string;
    rootId?: string;
    teamSlug: string;
    sport: string;
  }) {
    const res = await fetch("/api/forum/posts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        content: data.content,
        team_slug: data.teamSlug,
        sport: data.sport,
      }),
    });
    if (!res.ok) {
      alert("Det gick inte att skapa inlägget. Försök igen.");
      return;
    }
    const newPost = (await res.json()) as ForumPost;
    setPosts((prev) => [newPost, ...prev]);
  }

  return (
    <div>
      <TagFilter active={sort} onChange={setSort} />

      <div className="mt-5 flex flex-col divide-y divide-border/25">
        {loading ? (
          <div className="space-y-4 py-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex gap-3">
                <div className="w-9 h-9 rounded-full bg-card skeleton-wave shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="h-3 w-28 rounded bg-card skeleton-wave" />
                  <div className="h-3 w-full rounded bg-card skeleton-wave" />
                  <div className="h-3 w-3/4 rounded bg-card skeleton-wave" />
                </div>
              </div>
            ))}
          </div>
        ) : posts.length === 0 ? (
          <div className="py-20 text-center text-muted-foreground text-sm">
            Inga inlägg ännu. Var först att starta diskussionen!
          </div>
        ) : (
          posts.map((post, i) => (
            <div key={post.id} className="py-4">
              <PostItem
                post={post}
                depth={0}
                showThread={post.reply_count > 0}
                onReply={() => fetchPosts(sort)}
                index={i}
              />
            </div>
          ))
        )}
      </div>

      {/* New post drawer */}
      <ComposeDrawer
        open={composeOpen}
        onOpenChange={setComposeOpen}
        teamSlug={teamSlug}
        sport={sport}
        onPost={handlePost}
      />

      {/* FAB */}
      {user && (
        <motion.button
          onClick={() => setComposeOpen(true)}
          whileTap={{ scale: 0.88 }}
          transition={{ type: "spring", stiffness: 500, damping: 30, mass: 0.6 }}
          className="fixed right-5 bottom-[calc(max(1.5rem,env(safe-area-inset-bottom))+4rem)] w-14 h-14 bg-pitch text-white rounded-full shadow-[0_4px_24px_rgba(29,158,117,0.5)] flex items-center justify-center hover:bg-pitch/90 transition-colors z-40 touch-manipulation"
          aria-label="Nytt inlägg"
        >
          <Plus className="w-6 h-6" strokeWidth={2.5} />
        </motion.button>
      )}
    </div>
  );
}
