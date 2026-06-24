"use client";

import { useState, useOptimistic } from "react";
import { useUser } from "@clerk/nextjs";
import Image from "next/image";
import { Heart, MessageCircle, Repeat2, Share2, Flag } from "lucide-react";
import Link from "next/link";
import { motion } from "motion/react";
import type { ForumPost } from "@/lib/types";
import QuoteBox from "./QuoteBox";
import ComposeDrawer from "./ComposeDrawer";
import { ProfileLink } from "@/components/profile/ProfilePopup";

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
  index?: number;
}

export default function PostItem({
  post,
  depth = 0,
  showThread = false,
  onReply,
  index = 0,
}: Props) {
  const { user } = useUser();
  const [replyOpen, setReplyOpen] = useState(false);
  const [liked, setLiked] = useState(false);
  const [likeAnimating, setLikeAnimating] = useState(false);
  const [reposted, setReposted] = useState(false);
  const [reported, setReported] = useState(false);
  const [optimisticLikes, addOptimisticLike] = useOptimistic(
    post.like_count,
    (state: number, delta: number) => state + delta
  );
  const [optimisticReposts, addOptimisticRepost] = useOptimistic(
    post.repost_count,
    (state: number, delta: number) => state + delta
  );

  // Stagger only top-level posts, cap at 5 items to avoid long waits
  const animDelay = depth === 0 ? Math.min(index * 0.055, 0.28) : 0;

  async function toggleLike() {
    if (!user) return;
    const next = !liked;
    addOptimisticLike(next ? 1 : -1);
    setLiked(next);
    if (next) {
      setLikeAnimating(true);
      setTimeout(() => setLikeAnimating(false), 400);
    }
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

  async function handleReport() {
    if (!user || reported) return;
    setReported(true);
    try {
      await fetch("/api/forum/report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ postId: post.id }),
      });
    } catch {
      setReported(false);
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
    } catch {
      // ignore
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
  const showLine = showThread || depth > 0 || hasReplies;

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 18, filter: "blur(8px)" }}
        whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
        viewport={{ once: true, margin: "-48px" }}
        transition={{
          duration: 0.38,
          delay: animDelay,
          ease: [0.25, 0.46, 0.45, 0.94],
        }}
        className={`flex gap-3 ${depth > 0 ? "ml-9" : ""}`}
      >
        {/* Avatar + thread line */}
        <div className="flex flex-col items-center">
          <ProfileLink
            userId={post.author_id}
            className="w-9 h-9 rounded-full bg-pitch/20 flex items-center justify-center text-pitch text-xs font-bold shrink-0 overflow-hidden relative hover:ring-2 hover:ring-pitch/40 transition-all"
          >
            {post.author_avatar ? (
              <Image src={post.author_avatar} alt="" fill className="object-cover" />
            ) : (
              initials(post.author_name)
            )}
          </ProfileLink>
          {showLine && (
            <div className="w-px flex-1 min-h-[16px] bg-border/40 mt-1" />
          )}
        </div>

        <div className="flex-1 pb-4 min-w-0">
          {/* Header */}
          <div className="flex items-center gap-1.5 mb-1 flex-wrap">
            <ProfileLink
              userId={post.author_id}
              className="text-sm font-semibold text-foreground hover:underline"
            >
              {post.author_name}
            </ProfileLink>
            <span className="text-xs text-muted-foreground">
              @{post.author_name.toLowerCase().replace(/\s+/g, "")}
            </span>
            <span className="text-xs text-muted-foreground/60">·</span>
            <span className="text-xs text-muted-foreground/60">
              {timeAgo(post.created_at)}
            </span>
            {post.pinned && (
              <span className="ml-auto text-[10px] font-medium text-pitch bg-pitch/10 px-2 py-0.5 rounded-full">
                📌 Fäst
              </span>
            )}
          </div>

          {/* Content */}
          <Link href={`/forum/${post.team_slug}/${post.id}`} className="block group">
            <p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap group-hover:text-foreground/90 transition-colors">
              {post.content}
            </p>
          </Link>

          {/* Quoted post */}
          {post.quoted_post && <QuoteBox post={post.quoted_post} />}

          {/* Images */}
          {post.images && post.images.length > 0 && (
            <div className="mt-2 flex gap-2 flex-wrap">
              {post.images.map((src, i) => (
                <Image
                  key={i}
                  src={src}
                  alt=""
                  width={300}
                  height={192}
                  className="rounded-xl max-h-48 object-cover"
                />
              ))}
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center gap-4 mt-3 -ml-1">
            <button
              onClick={() => user && setReplyOpen(true)}
              className="flex items-center gap-1.5 text-muted-foreground hover:text-pitch transition-colors touch-manipulation"
            >
              <MessageCircle className="w-4 h-4" />
              {post.reply_count > 0 && (
                <span className="text-xs tabular-nums">{post.reply_count}</span>
              )}
            </button>

            <button
              onClick={toggleRepost}
              className={`flex items-center gap-1.5 transition-colors touch-manipulation ${
                reposted
                  ? "text-emerald-500"
                  : "text-muted-foreground hover:text-emerald-500"
              }`}
            >
              <Repeat2 className="w-4 h-4" />
              {optimisticReposts > 0 && (
                <span className="text-xs tabular-nums">{optimisticReposts}</span>
              )}
            </button>

            <button
              onClick={toggleLike}
              className={`flex items-center gap-1.5 transition-colors touch-manipulation ${
                liked
                  ? "text-rose-500"
                  : "text-muted-foreground hover:text-rose-500"
              }`}
            >
              <Heart
                className={`w-4 h-4 ${liked ? "fill-current" : ""}`}
                style={{
                  transition:
                    "transform 0.25s cubic-bezier(0.34,1.56,0.64,1), color 0.15s ease",
                  transform: likeAnimating ? "scale(1.4)" : "scale(1)",
                }}
              />
              {optimisticLikes > 0 && (
                <span className="text-xs tabular-nums">{optimisticLikes}</span>
              )}
            </button>

            <button
              onClick={share}
              className="flex items-center gap-1.5 text-muted-foreground hover:text-pitch transition-colors touch-manipulation"
            >
              <Share2 className="w-4 h-4" />
            </button>

            <button
              onClick={handleReport}
              disabled={reported}
              className={`flex items-center gap-1.5 ml-auto transition-colors touch-manipulation ${
                reported
                  ? "text-amber-500"
                  : "text-muted-foreground hover:text-amber-500"
              }`}
              title="Rapportera inlägg"
            >
              <Flag className="w-3.5 h-3.5" />
              {reported && <span className="text-xs">Skickat</span>}
            </button>
          </div>

          {/* Recursive replies */}
          {post.replies && post.replies.length > 0 && depth < 3 && (
            <div className="mt-2">
              {post.replies.map((reply, i) => (
                <PostItem
                  key={reply.id}
                  post={reply}
                  depth={depth + 1}
                  showThread={reply.reply_count > 0}
                  onReply={onReply}
                  index={i}
                />
              ))}
            </div>
          )}
        </div>
      </motion.div>

      {/* Reply drawer — outside motion.div to avoid stacking context issues */}
      <ComposeDrawer
        open={replyOpen}
        onOpenChange={setReplyOpen}
        parentId={post.id}
        rootId={post.root_id ?? post.id}
        teamSlug={post.team_slug ?? ""}
        sport={post.sport}
        replyTo={post.author_name}
        onPost={handleReply}
      />
    </>
  );
}
