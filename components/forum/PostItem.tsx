"use client";

import { useState, useOptimistic } from "react";
import { useUser } from "@clerk/nextjs";
import Image from "next/image";
import { Heart, MessageCircle, Repeat2, Share2 } from "lucide-react";
import Link from "next/link";
import type { ForumPost } from "@/lib/types";
import QuoteBox from "./QuoteBox";
import ComposePost from "./ComposePost";

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "just nu";
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h`;
  return `${Math.floor(h / 24)}d`;
}

function initials(name: string): string {
  return name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

interface Props {
  post: ForumPost;
  depth?: number;
  showThread?: boolean;
  onReply?: (post: ForumPost) => void;
}

export default function PostItem({ post, depth = 0, showThread = false, onReply }: Props) {
  const { user } = useUser();
  const [replyOpen, setReplyOpen] = useState(false);
  const [liked, setLiked] = useState(false);
  const [reposted, setReposted] = useState(false);
  const [optimisticLikes, addOptimisticLike] = useOptimistic(
    post.like_count,
    (state: number, delta: number) => state + delta
  );
  const [optimisticReposts, addOptimisticRepost] = useOptimistic(
    post.repost_count,
    (state: number, delta: number) => state + delta
  );

  async function toggleLike() {
    if (!user) return;
    const next = !liked;
    addOptimisticLike(next ? 1 : -1);
    setLiked(next);
    try {
      const res = await fetch("/api/forum/like", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ postId: post.id }),
      });
      if (!res.ok) throw new Error("Like failed");
    } catch {
      addOptimisticLike(next ? -1 : 1);
      setLiked(!next);
    }
  }

  async function toggleRepost() {
    if (!user) return;
    const next = !reposted;
    addOptimisticRepost(next ? 1 : -1);
    setReposted(next);
    try {
      const res = await fetch("/api/forum/repost", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ postId: post.id }),
      });
      if (!res.ok) throw new Error("Repost failed");
    } catch {
      addOptimisticRepost(next ? -1 : 1);
      setReposted(!next);
    }
  }

  async function share() {
    const url = `${window.location.origin}/forum/${post.team_slug}/${post.id}`;
    try {
      if (navigator.share) {
        await navigator.share({ url });
      } else {
        await navigator.clipboard.writeText(url);
      }
    } catch (err) {
      console.error("Share failed:", err);
    }
  }

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
        parent_id: post.id,
        root_id: post.root_id ?? post.id,
        team_slug: data.teamSlug,
        sport: data.sport,
        depth: (post.depth ?? 0) + 1,
      }),
    });
    if (res.ok) {
      const newPost = await res.json();
      setReplyOpen(false);
      onReply?.(newPost);
    }
  }

  const hasReplies = (post.replies?.length ?? 0) > 0;
  const showLine = showThread || (depth > 0) || hasReplies;

  return (
    <div className={`flex gap-3 ${depth > 0 ? "ml-9" : ""}`}>
      {/* Thread line + avatar column */}
      <div className="flex flex-col items-center">
        <div className="w-9 h-9 rounded-full bg-pitch/20 flex items-center justify-center text-pitch text-xs font-bold shrink-0 overflow-hidden">
          {post.author_avatar ? (
            <Image src={post.author_avatar} alt="" fill className="object-cover" />
          ) : (
            initials(post.author_name)
          )}
        </div>
        {showLine && <div className="w-px flex-1 min-h-[16px] bg-border/50 mt-1" />}
      </div>

      <div className="flex-1 pb-4 min-w-0">
        {/* Header */}
        <div className="flex items-center gap-2 mb-1">
          <span className="text-sm font-semibold text-foreground">{post.author_name}</span>
          <span className="text-xs text-muted-foreground">
            @{post.author_name.toLowerCase().replace(/\s+/g, "")}
          </span>
          <span className="text-xs text-muted-foreground">· {timeAgo(post.created_at)}</span>
        </div>

        {/* Content */}
        <Link href={`/forum/${post.team_slug}/${post.id}`} className="block">
          <p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap">{post.content}</p>
        </Link>

        {/* Quoted post */}
        {post.quoted_post && <QuoteBox post={post.quoted_post} />}

        {/* Images */}
        {post.images && post.images.length > 0 && (
          <div className="mt-2 flex gap-2 flex-wrap">
            {post.images.map((src, i) => (
              <Image key={i} src={src} alt="" width={300} height={192} className="rounded-lg max-h-48 object-cover" />
            ))}
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center gap-5 mt-2 -ml-1">
          <button
            onClick={() => setReplyOpen(!replyOpen)}
            className="flex items-center gap-1.5 text-muted-foreground hover:text-pitch transition-colors"
          >
            <MessageCircle className="w-4 h-4" />
            {post.reply_count > 0 && (
              <span className="text-xs">{post.reply_count}</span>
            )}
          </button>

          <button
            onClick={toggleRepost}
            className={`flex items-center gap-1.5 transition-colors ${
              reposted ? "text-green-500" : "text-muted-foreground hover:text-green-500"
            }`}
          >
            <Repeat2 className="w-4 h-4" />
            {optimisticReposts > 0 && (
              <span className="text-xs">{optimisticReposts}</span>
            )}
          </button>

          <button
            onClick={toggleLike}
            className={`flex items-center gap-1.5 transition-colors ${
              liked ? "text-red-500" : "text-muted-foreground hover:text-red-500"
            }`}
          >
            <Heart className={`w-4 h-4 ${liked ? "fill-current" : ""}`} />
            {optimisticLikes > 0 && (
              <span className="text-xs">{optimisticLikes}</span>
            )}
          </button>

          <button
            onClick={share}
            className="flex items-center gap-1.5 text-muted-foreground hover:text-pitch transition-colors"
          >
            <Share2 className="w-4 h-4" />
          </button>
        </div>

        {/* Inline reply compose */}
        {replyOpen && (
          <div className="mt-3">
            <ComposePost
              parentId={post.id}
              rootId={post.root_id ?? post.id}
              teamSlug={post.team_slug ?? ""}
              sport={post.sport}
              onPost={handleReply}
              placeholder={`Svara ${post.author_name}…`}
            />
          </div>
        )}

        {/* Recursive replies (max depth 3) */}
        {post.replies && post.replies.length > 0 && depth < 3 && (
          <div className="mt-2">
            {post.replies.map((reply) => (
              <PostItem
                key={reply.id}
                post={reply}
                depth={depth + 1}
                showThread={reply.reply_count > 0}
                onReply={onReply}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
