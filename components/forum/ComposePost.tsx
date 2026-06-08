"use client";

import { useState } from "react";
import { useUser } from "@clerk/nextjs";
import Image from "next/image";

function initials(name: string): string {
  return name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

interface Props {
  parentId?: string;
  rootId?: string;
  teamSlug: string;
  sport?: string;
  onPost: (post: {
    content: string;
    parentId?: string;
    rootId?: string;
    teamSlug: string;
    sport: string;
  }) => Promise<void>;
  placeholder?: string;
}

export default function ComposePost({
  parentId,
  rootId,
  teamSlug,
  sport = "football",
  onPost,
  placeholder = "Vad tänker du?",
}: Props) {
  const { user } = useUser();
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(false);

  if (!user) return null;

  const name = user.fullName ?? user.username ?? "Anonym";
  const max = 500;
  const remaining = max - content.length;

  async function handlePost() {
    if (!content.trim() || loading) return;
    setLoading(true);
    try {
      await onPost({ content: content.trim(), parentId, rootId, teamSlug, sport });
      setContent("");
    } catch (err) {
      console.error("Failed to post:", err);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex gap-3">
      <div className="w-9 h-9 rounded-full bg-pitch flex items-center justify-center text-white text-xs font-bold shrink-0">
        {user.imageUrl ? (
          <Image src={user.imageUrl} alt="" width={36} height={36} className="rounded-full object-cover" />
        ) : (
          initials(name)
        )}
      </div>
      <div className="flex-1">
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value.slice(0, max))}
          placeholder={placeholder}
          rows={3}
          className="w-full bg-transparent text-foreground placeholder:text-muted-foreground text-sm resize-none outline-none border-b border-border/40 pb-2 focus:border-pitch/60 transition-colors"
        />
        <div className="flex items-center justify-between mt-2">
          <span
            className={`text-xs ${
              remaining < 50 ? (remaining < 10 ? "text-destructive" : "text-amber-500") : "text-muted-foreground"
            }`}
          >
            {remaining}
          </span>
          <button
            onClick={handlePost}
            disabled={!content.trim() || loading}
            className="px-4 py-1.5 rounded-full bg-pitch text-white text-sm font-medium disabled:opacity-40 disabled:cursor-not-allowed hover:bg-pitch/90 transition-colors"
          >
            {loading ? "Postar…" : "Posta"}
          </button>
        </div>
      </div>
    </div>
  );
}
