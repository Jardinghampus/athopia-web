"use client";

import { useState } from "react";
import PostItem from "@/components/forum/PostItem";
import ComposePost from "@/components/forum/ComposePost";
import type { ForumPost } from "@/lib/types";

interface Props {
  root: ForumPost;
  replies: ForumPost[];
  teamSlug: string;
  sport: string;
}

export default function ThreadClient({ root, replies: initialReplies, teamSlug, sport }: Props) {
  const [replies, setReplies] = useState<ForumPost[]>(initialReplies);

  async function handleReply(data: {
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
        parent_id: root.id,
        root_id: root.id,
        team_slug: data.teamSlug,
        sport: data.sport,
        depth: 1,
      }),
    });
    if (res.ok) {
      const newPost = await res.json() as ForumPost;
      setReplies((prev) => [...prev, newPost]);
    }
  }

  return (
    <div>
      {/* Root post */}
      <div className="pb-4 border-b border-border/40">
        <PostItem post={root} depth={0} showThread={replies.length > 0} />
      </div>

      {/* Replies */}
      <div className="mt-4 flex flex-col divide-y divide-border/20">
        {replies.map((reply) => (
          <div key={reply.id} className="py-3">
            <PostItem
              post={reply}
              depth={1}
              showThread={(reply.reply_count ?? 0) > 0}
              onReply={(newPost) => setReplies((prev) => [...prev, newPost])}
            />
          </div>
        ))}
      </div>

      {/* Compose reply */}
      <div className="mt-6 pt-4 border-t border-border/40">
        <ComposePost
          parentId={root.id}
          rootId={root.id}
          teamSlug={teamSlug}
          sport={sport}
          onPost={handleReply}
          placeholder={`Svara ${root.author_name}…`}
        />
      </div>
    </div>
  );
}
