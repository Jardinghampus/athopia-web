"use client";

import Link from "next/link";
import type { ForumPost } from "@/lib/types";

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "just nu";
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h`;
  return `${Math.floor(h / 24)}d`;
}

export default function QuoteBox({ post }: { post: ForumPost }) {
  return (
    <Link
      href={`/forum/${post.team_slug}/${post.id}`}
      className="block mt-2 border border-border/60 rounded-lg p-3 bg-muted/30 hover:bg-muted/50 transition-colors"
    >
      <div className="flex items-center gap-1.5 mb-1.5">
        <span className="text-xs font-medium text-foreground">{post.author_name}</span>
        <span className="text-xs text-muted-foreground">· {timeAgo(post.created_at)}</span>
      </div>
      <p className="text-sm text-muted-foreground line-clamp-2">{post.content}</p>
    </Link>
  );
}
