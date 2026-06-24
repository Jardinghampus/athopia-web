"use client";

import { useState, useEffect, useCallback } from "react";
import { useUser } from "@clerk/nextjs";
import PostItem from "@/components/forum/PostItem";
import { AIInputWithLoading } from "@/components/ui/ai-input-with-loading";
import type { ForumPost } from "@/lib/types";

interface Props {
  teamSlug: string;
  sport: string;
  initialPosts: ForumPost[];
}

export default function ForumClient({ teamSlug, sport, initialPosts }: Props) {
  const { user } = useUser();
  const [posts, setPosts] = useState<ForumPost[]>(initialPosts);
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

      {/* Sticky bottom compose bar */}
      {user && (
        <div className="fixed bottom-0 inset-x-0 z-40 max-w-[600px] mx-auto border-t border-border/30 bg-background/95 backdrop-blur-xl px-4 py-3 pb-[max(env(safe-area-inset-bottom),0.75rem)]">
          <AIInputWithLoading
            placeholder="Skriv ett inlägg…"
            onSubmit={async (val) => {
              await handlePost({ content: val, teamSlug, sport });
            }}
          />
        </div>
      )}
    </div>
  );
}
