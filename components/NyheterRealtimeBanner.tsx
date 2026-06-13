"use client";

/**
 * WEB-30: "X nya artiklar — ladda om"-banner.
 *
 * Tidigare: Supabase Realtime (öppen WebSocket + WAL-decode på varje insert).
 * Nu: pollar /api/articles/recent var 90:e sekund. Endpointen är CDN-cachad
 * (s-maxage=60) → max ~1 Supabase-query/min totalt, oavsett antal besökare.
 * Ingen persistent anslutning, ingen WAL-decode → kraftigt lägre Supabase-usage.
 */

import { useEffect, useRef, useState, useCallback } from "react";
import { Sparkles, RefreshCw } from "lucide-react";

const POLL_INTERVAL_MS = 90_000;

export function NyheterRealtimeBanner() {
  const [hasNew, setHasNew] = useState(false);
  const baselineRef = useRef<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function check() {
      try {
        const res = await fetch("/api/articles/recent", { cache: "no-store" });
        if (!res.ok) return;
        const { latest } = (await res.json()) as { latest: string | null };
        if (cancelled || !latest) return;

        if (baselineRef.current === null) {
          // Första pollen: sätt baslinje, visa inget
          baselineRef.current = latest;
        } else if (latest > baselineRef.current) {
          setHasNew(true);
        }
      } catch {
        // Tyst — banner är icke-kritisk
      }
    }

    void check();
    const id = setInterval(check, POLL_INTERVAL_MS);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, []);

  const handleReload = useCallback(() => {
    window.location.reload();
  }, []);

  if (!hasNew) return null;

  return (
    <button
      onClick={handleReload}
      className="fixed top-20 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 px-4 py-2 rounded-full bg-pitch text-white text-sm font-medium shadow-lg hover:bg-pitch/90 transition-all animate-in slide-in-from-top-4"
      aria-live="polite"
    >
      <Sparkles className="w-3.5 h-3.5" />
      Nya artiklar
      <RefreshCw className="w-3.5 h-3.5" />
    </button>
  );
}
