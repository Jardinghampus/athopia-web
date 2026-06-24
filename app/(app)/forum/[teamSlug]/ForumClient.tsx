"use client";

import { useState, useEffect, useCallback } from "react";
import { Plus } from "lucide-react";
import { motion } from "motion/react";
import { useUser } from "@clerk/nextjs";
import PostItem from "@/components/forum/PostItem";
import ComposeDrawer from "@/components/forum/ComposeDrawer";
import type { ForumPost } from "@/lib/types";

interface Props {
  teamSlug: string;
  sport: string;
  initialPosts: ForumPost[];
}

export default function ForumClient({ teamSlug, sport, initialPosts }: Props) {
  const { user } = useUser();
  const [posts, setPosts] = useState<ForumPost[]>(initialPosts);
  const [composeOpen, setComposeOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(
        `/api/forum/posts?teamSlug=${teamSlug}&sport=${sport}&sort=hot`
      );
      if (res.ok) {
        const json = (await res.json()) as { posts: ForumPost[] };
        setPosts(json.posts ?? []);
      }
    } finally {
      setLoading(false);
    }
  }, [teamSlug, sport]);

  // Keep posts in sync if user navigates back
  useEffect(() => {
    setPosts(initialPosts);
  }, [initialPosts]);

  async function handlePost(data: {
    content: string;
    label?: string;
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
        label: data.label ?? null,
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
      {loading ? (
        <div className="space-y-3 py-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="rounded-2xl border border-border/30 bg-card/20 p-4 flex gap-3">
              <div className="w-8 h-8 rounded-full bg-muted skeleton-wave shrink-0" />
              <div className="flex-1 space-y-2">
                <div className="h-3 w-28 rounded bg-muted skeleton-wave" />
                <div className="h-3 w-full rounded bg-muted skeleton-wave" />
                <div className="h-3 w-2/3 rounded bg-muted skeleton-wave" />
              </div>
            </div>
          ))}
        </div>
      ) : posts.length === 0 ? (
        <div className="py-20 text-center text-muted-foreground text-sm">
          Inga inlägg ännu. Var första att starta diskussionen!
        </div>
      ) : (
        <div className="flex flex-col gap-3 py-2">
          {posts.map((post, i) => (
            <PostItem
              key={post.id}
              post={post}
              depth={0}
              showThread={post.reply_count > 0}
              onReply={() => refresh()}
              index={i}
            />
          ))}
        </div>
      )}

      <ComposeDrawer
        open={composeOpen}
        onOpenChange={setComposeOpen}
        teamSlug={teamSlug}
        sport={sport}
        onPost={handlePost}
      />

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
