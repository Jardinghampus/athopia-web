"use client";

/**
 * WEB-30: Realtime-banner — visar "X nya artiklar — ladda om" om nya artiklar publicerats.
 * Supabase Realtime: lyssnar på INSERT i articles WHERE status='published'.
 */

import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase";
import { Sparkles, RefreshCw } from "lucide-react";

export function NyheterRealtimeBanner() {
  const [newCount, setNewCount] = useState(0);

  useEffect(() => {
    let supabase: ReturnType<typeof createClient>;
    try {
      supabase = createClient();
    } catch {
      return;
    }

    const channel = supabase
      .channel("articles-new")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "articles",
          filter: "status=eq.published",
        },
        () => {
          setNewCount((c) => c + 1);
        }
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, []);

  const handleReload = useCallback(() => {
    window.location.reload();
  }, []);

  if (newCount === 0) return null;

  return (
    <button
      onClick={handleReload}
      className="fixed top-20 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 px-4 py-2 rounded-full bg-pitch text-white text-sm font-medium shadow-lg hover:bg-pitch/90 transition-all animate-in slide-in-from-top-4"
      aria-live="polite"
    >
      <Sparkles className="w-3.5 h-3.5" />
      {newCount === 1 ? "1 ny artikel" : `${newCount} nya artiklar`}
      <RefreshCw className="w-3.5 h-3.5" />
    </button>
  );
}
