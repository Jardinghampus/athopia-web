"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import Link from "next/link";
import { Newspaper, MessageSquare, Brain, Podcast, Loader2, RefreshCw } from "lucide-react";
import { useFavoriteTeam } from "@/hooks/useFavoriteTeam";
import { createClient } from "@supabase/supabase-js";
import type { FeedItem, FeedItemType } from "@/lib/types";

const PAGE_SIZE = 20;

const TYPE_META: Record<FeedItemType, { label: string; color: string; icon: React.ElementType }> = {
  news: { label: "Nyhet", color: "#1D9E75", icon: Newspaper },
  forum: { label: "Forum", color: "#7F77DD", icon: MessageSquare },
  summary: { label: "AI-analys", color: "#BA7517", icon: Brain },
  podcast: { label: "Podcast", color: "#378ADD", icon: Podcast },
};

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "just nu";
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h`;
  return `${Math.floor(h / 24)}d`;
}

function FeedItemCard({ item }: { item: FeedItem }) {
  const meta = TYPE_META[item.type];
  const Icon = meta.icon;

  return (
    <Link
      href={item.href}
      className="group flex items-start gap-3 bg-card hover:bg-card/80 border border-border rounded-xl p-4 transition-colors"
      style={{ borderLeftWidth: 3, borderLeftColor: meta.color }}
    >
      <div
        className="mt-0.5 shrink-0 w-8 h-8 rounded-full flex items-center justify-center"
        style={{ backgroundColor: meta.color + "20" }}
      >
        <Icon className="w-4 h-4" style={{ color: meta.color }} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span
            className="text-[11px] font-semibold uppercase tracking-wide"
            style={{ color: meta.color }}
          >
            {meta.label}
          </span>
          <span className="text-[11px] text-muted-foreground">{timeAgo(item.time)}</span>
          {item.source && (
            <>
              <span className="text-[11px] text-muted-foreground">·</span>
              <span className="text-[11px] text-muted-foreground truncate">{item.source}</span>
            </>
          )}
        </div>
        <p className="text-sm font-medium text-foreground group-hover:text-pitch transition-colors line-clamp-2">
          {item.title}
        </p>
        {item.subtitle && (
          <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{item.subtitle}</p>
        )}
      </div>
    </Link>
  );
}

function buildSupabaseClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";
  if (!url || !key) return null;
  return createClient(url, key);
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function fetchFeedPage(db: any, teamSlug: string | null, offset: number): Promise<FeedItem[]> {
  const items: FeedItem[] = [];

  const articlesQ = db
    .from("articles")
    .select("id, title, summary, source_name, published_at, slug, source_name, entity_ids")
    .eq("status", "published")
    .order("published_at", { ascending: false })
    .range(offset, offset + PAGE_SIZE - 1);

  const threadsQ = db
    .from("forum_threads")
    .select("id, title, content, author_name, created_at, team_id")
    .order("created_at", { ascending: false })
    .range(offset, offset + PAGE_SIZE - 1);

  const podcastsQ = db
    .from("podcasts")
    .select("id, title, show_name, published_at")
    .order("published_at", { ascending: false })
    .range(offset, offset + PAGE_SIZE - 1);

  const [artRes, thrRes, podRes] = await Promise.all([articlesQ, threadsQ, podcastsQ]);

  for (const a of (artRes.data ?? []) as any[]) {
    const entityIds: string[] = a.entity_ids ?? [];
    if (teamSlug && entityIds.length > 0 && !entityIds.includes(teamSlug)) continue;
    const isAI = (a.source_name ?? "").toLowerCase().includes("athopia");
    items.push({
      id: `article-${a.id}`,
      type: isAI ? "summary" : "news",
      title: a.title,
      subtitle: a.summary,
      source: a.source_name,
      time: a.published_at,
      href: `/app/artikel/${a.slug}`,
    });
  }

  for (const t of (thrRes.data ?? []) as any[]) {
    items.push({
      id: `thread-${t.id}`,
      type: "forum",
      title: t.title,
      subtitle: t.content?.slice(0, 80),
      source: t.author_name,
      time: t.created_at,
      href: `/app/forum/${t.team_id ?? ""}`,
    });
  }

  for (const p of (podRes.data ?? []) as any[]) {
    items.push({
      id: `podcast-${p.id}`,
      type: "podcast",
      title: p.title,
      source: p.show_name,
      time: p.published_at,
      href: `/app/podcast/${p.id}`,
    });
  }

  items.sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime());
  return items.slice(0, PAGE_SIZE);
}

export function FeedClient() {
  const { slug, isLoaded, needsOnboarding } = useFavoriteTeam();
  const [items, setItems] = useState<FeedItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [newCount, setNewCount] = useState(0);
  const bottomRef = useRef<HTMLDivElement>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const dbRef = useRef<any>(null);

  const load = useCallback(
    async (reset = false) => {
      const db = buildSupabaseClient();
      if (!db) { setLoading(false); return; }
      dbRef.current = db;

      const currentOffset = reset ? 0 : offset;
      if (reset) setLoading(true);
      else setLoadingMore(true);

      const newItems = await fetchFeedPage(db, isLoaded ? slug : null, currentOffset);

      if (reset) {
        setItems(newItems);
        setOffset(newItems.length);
        setNewCount(0);
      } else {
        setItems((prev) => {
          const ids = new Set(prev.map((i) => i.id));
          const merged = [...prev, ...newItems.filter((i) => !ids.has(i.id))];
          return merged;
        });
        setOffset((o) => o + newItems.length);
      }

      setHasMore(newItems.length === PAGE_SIZE);
      setLoading(false);
      setLoadingMore(false);
    },
    [slug, isLoaded, offset]
  );

  // Initialload
  useEffect(() => {
    if (!isLoaded) return;
    void load(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoaded, slug]);

  // Supabase Realtime
  useEffect(() => {
    const db = buildSupabaseClient();
    if (!db) return;
    const channel = db
      .channel("feed-articles")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "articles" }, () => {
        setNewCount((n) => n + 1);
      })
      .subscribe();
    return () => { void db.removeChannel(channel); };
  }, []);

  // Infinite scroll
  useEffect(() => {
    if (!bottomRef.current || loadingMore || !hasMore) return;
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry?.isIntersecting) void load(); },
      { threshold: 0.1 }
    );
    obs.observe(bottomRef.current);
    return () => obs.disconnect();
  }, [loadingMore, hasMore, load]);

  if (!isLoaded) return null;

  const teamLabel = slug ? slug.replace(/-/g, " ").toUpperCase() : "ALLSVENSKAN";

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-heading text-4xl text-foreground leading-none">MITT FEED</h1>
          <p className="text-sm text-muted-foreground mt-1">{teamLabel}</p>
        </div>
        {!needsOnboarding && (
          <Link
            href="/app/onboarding"
            className="text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            Byt lag
          </Link>
        )}
      </div>

      {newCount > 0 && (
        <button
          onClick={() => load(true)}
          className="w-full flex items-center justify-center gap-2 mb-4 py-2.5 rounded-xl bg-pitch/10 border border-pitch/30 text-sm text-pitch hover:bg-pitch/20 transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
          {newCount} ny{newCount > 1 ? "a" : ""} artikel{newCount > 1 ? "ar" : ""}
        </button>
      )}

      {loading ? (
        <div className="flex flex-col gap-3">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="h-20 rounded-xl bg-card animate-pulse border border-border" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="text-center py-20 text-muted-foreground">
          <p className="text-sm">Inga items i feeden ännu.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {items.map((item) => (
            <FeedItemCard key={item.id} item={item} />
          ))}
        </div>
      )}

      <div ref={bottomRef} className="h-4" />

      {loadingMore && (
        <div className="flex justify-center py-4">
          <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
        </div>
      )}

      {!hasMore && items.length > 0 && (
        <p className="text-center text-xs text-muted-foreground py-4">Inga fler items</p>
      )}
    </div>
  );
}
