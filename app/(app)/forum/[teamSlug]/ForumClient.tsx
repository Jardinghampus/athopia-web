"use client";

import { useState, useEffect, useCallback } from "react";
import { Plus } from "lucide-react";
import { useUser } from "@clerk/nextjs";
import PostItem from "@/components/forum/PostItem";
import ComposePost from "@/components/forum/ComposePost";
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
      const res = await fetch(`/api/forum/posts?teamSlug=${teamSlug}&sport=${sport}&sort=${s}`);
      if (!res.ok) {
        console.error("Failed to fetch posts:", await res.text());
        setPosts([]);
        return;
      }
      const json = await res.json() as { posts: ForumPost[] };
      setPosts(json.posts ?? []);
    } catch (error) {
      console.error("Error fetching posts:", error);
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
    try {
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
        console.error("Failed to create post:", await res.text());
        alert("Det gick inte att skapa inlägget. Försök igen.");
        return;
      }
      const newPost = await res.json() as ForumPost;
      setPosts((prev) => [newPost, ...prev]);
      setComposeOpen(false);
    } catch (error) {
      console.error("Error creating post:", error);
      alert("Det gick inte att skapa inlägget. Försök igen.");
    }
  }

  return (
    <div>
      <TagFilter active={sort} onChange={setSort} />

      {composeOpen && user && (
        <div className="mt-4 p-4 bg-card border border-border rounded-xl">
          <ComposePost
            teamSlug={teamSlug}
            sport={sport}
            onPost={handlePost}
          />
        </div>
      )}

      <div className="mt-4 flex flex-col divide-y divide-border/30">
        {loading ? (
          <div className="py-16 text-center text-muted-foreground text-sm">Laddar…</div>
        ) : posts.length === 0 ? (
          <div className="py-16 text-center text-muted-foreground text-sm">
            Inga inlägg ännu. Starta diskussionen!
          </div>
        ) : (
          posts.map((post) => (
            <div key={post.id} className="py-4">
              <PostItem
                post={post}
                depth={0}
                showThread={post.reply_count > 0}
                onReply={() => fetchPosts(sort)}
              />
            </div>
          ))
        )}
      </div>

      {/* FAB */}
      {user && (
        <button
          onClick={() => setComposeOpen(!composeOpen)}
          className="fixed bottom-6 right-6 w-14 h-14 bg-pitch text-white rounded-full shadow-lg flex items-center justify-center hover:bg-pitch/90 transition-colors z-50"
          aria-label="Nytt inlägg"
        >
          <Plus className="w-6 h-6" />
        </button>
      )}
    </div>
  );
}
