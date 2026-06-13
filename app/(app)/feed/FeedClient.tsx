"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import Link from "next/link";
import { Newspaper, MessageSquare, Brain, Podcast, Loader2, RefreshCw } from "lucide-react";
import { useFavoriteTeam } from "@/hooks/useFavoriteTeam";
import { UpgradePrompt } from "@/components/UpgradePrompt";
import { PullToRefresh } from "@/components/ui/PullToRefresh";
import type { FeedItem, FeedItemType } from "@/lib/types";

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
      className="group flex items-start gap-3 bg-card hover:bg-card/80 active:bg-muted border border-border rounded-xl p-4 transition-colors touch-manipulation"
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

const NEW_POLL_INTERVAL_MS = 90_000;

interface FeedResponse {
  items: FeedItem[];
  hasMore: boolean;
  gated: boolean;
}

async function fetchFeedPage(teamSlug: string | null, offset: number): Promise<FeedResponse> {
  const qs = new URLSearchParams({ offset: String(offset) });
  if (teamSlug) qs.set("team", teamSlug);
  const res = await fetch(`/api/feed?${qs.toString()}`, { cache: "no-store" });
  if (!res.ok) return { items: [], hasMore: false, gated: false };
  const data = (await res.json()) as Partial<FeedResponse>;
  return {
    items: data.items ?? [],
    hasMore: data.hasMore ?? false,
    gated: data.gated ?? false,
  };
}

export function FeedClient() {
  const { slug, isLoaded, needsOnboarding } = useFavoriteTeam();
  const [items, setItems] = useState<FeedItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [newCount, setNewCount] = useState(0);
  const [gated, setGated] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  const load = useCallback(
    async (reset = false) => {
      const currentOffset = reset ? 0 : offset;
      if (reset) setLoading(true);
      else setLoadingMore(true);

      const { items: newItems, hasMore: more, gated: isGated } = await fetchFeedPage(
        isLoaded ? slug : null,
        currentOffset
      );

      if (reset) {
        setItems(newItems);
        setOffset(newItems.length);
        setNewCount(0);
      } else {
        setItems((prev) => {
          const ids = new Set(prev.map((i) => i.id));
          return [...prev, ...newItems.filter((i) => !ids.has(i.id))];
        });
        setOffset((o) => o + newItems.length);
      }

      setGated(isGated);
      setHasMore(more && !isGated);
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

  // Ny-artikel-detektor: pollar CDN-cachad endpoint istället för Realtime
  // (ingen öppen WebSocket, ingen WAL-decode → lägre Supabase-usage).
  useEffect(() => {
    let cancelled = false;
    let baseline: string | null = null;

    async function check() {
      try {
        const res = await fetch("/api/articles/recent", { cache: "no-store" });
        if (!res.ok) return;
        const { latest } = (await res.json()) as { latest: string | null };
        if (cancelled || !latest) return;
        if (baseline === null) baseline = latest;
        else if (latest > baseline) setNewCount((n) => Math.max(n, 1));
      } catch { /* tyst */ }
    }

    void check();
    const id = setInterval(check, NEW_POLL_INTERVAL_MS);
    return () => { cancelled = true; clearInterval(id); };
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
    <PullToRefresh onRefresh={() => load(true)}>
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-heading text-4xl text-foreground leading-none">MITT FEED</h1>
          <p className="text-sm text-muted-foreground mt-1">{teamLabel}</p>
        </div>
        {!needsOnboarding && (
          <Link
            href="/onboarding"
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
            <div key={i} className="h-20 rounded-xl bg-card border border-border skeleton-wave" />
          ))}
        </div>
      ) : items.length === 0 ? (
        gated ? (
          <UpgradePrompt feature="unlimitedFeed" />
        ) : (
          <div className="text-center py-20 text-muted-foreground">
            <p className="text-sm">Inga items i feeden ännu.</p>
          </div>
        )
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

      {gated && items.length > 0 && (
        <div className="py-4">
          <UpgradePrompt feature="unlimitedFeed" />
        </div>
      )}

      {!hasMore && !gated && items.length > 0 && (
        <p className="text-center text-xs text-muted-foreground py-4">Inga fler items</p>
      )}
    </div>
    </PullToRefresh>
  );
}
