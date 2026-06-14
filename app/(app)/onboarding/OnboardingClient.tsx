"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "motion/react";
import { Check, ArrowRight, Bell, Zap, ChevronRight } from "lucide-react";
import { transitions } from "@/lib/motion";
import { useFavoriteTeam } from "@/hooks/useFavoriteTeam";
import { createClient } from "@supabase/supabase-js";

interface Team {
  id: string;
  name: string;
  slug: string | null;
  metadata: Record<string, unknown> | null;
}

function getColor(metadata: Record<string, unknown> | null): string {
  return (metadata?.["primary_color"] as string | undefined) ?? "#1D9E75";
}

function getInitials(name: string): string {
  return name
    .split(" ")
    .filter((w) => w.length > 1)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("")
    .slice(0, 3);
}

const LOAD_TIMEOUT_MS = 8000;

export function OnboardingClient() {
  const router = useRouter();
  const { setFavoriteTeam, markOnboardingDone } = useFavoriteTeam();
  const [teams, setTeams] = useState<Team[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [loadFailed, setLoadFailed] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";

    if (!url || !key) {
      setLoadFailed(true);
      return;
    }

    // Timeout guard — om Supabase inte svarar på 8s visar vi fallback
    timeoutRef.current = setTimeout(() => {
      setLoadFailed(true);
    }, LOAD_TIMEOUT_MS);

    const db = createClient(url, key);
    void db
      .from("entities")
      .select("id, name, slug, metadata")
      .eq("type", "team")
      .order("name")
      .then(({ data, error }) => {
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
          timeoutRef.current = null;
        }
        if (error || !data || data.length === 0) {
          setLoadFailed(true);
          return;
        }
        // Allsvenskan-lag via metadata.league (sportsmonks_id saknas i entities)
        const filtered = (data as Team[]).filter(
          (t) => (t.metadata?.["league"] as string | undefined) === "Allsvenskan"
        );
        setTeams(filtered.length > 0 ? filtered : (data as Team[]));
      });

    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  const selectedTeam = teams.find((t) => (t.slug ?? t.id) === selected);
  const selectedColor = selectedTeam ? getColor(selectedTeam.metadata) : "#1D9E75";

  // Prefetcha feed i bakgrunden direkt vid val
  const prefetchFeed = useCallback((teamSlug: string) => {
    void fetch(`/api/feed?team=${encodeURIComponent(teamSlug)}&offset=0`, { cache: "no-store" })
      .then((r) => r.ok ? r.json() : null)
      .then((data) => {
        if (data) {
          try {
            sessionStorage.setItem("prefetch_feed", JSON.stringify({ slug: teamSlug, data, ts: Date.now() }));
          } catch {}
        }
      });
  }, []);

  const handleContinue = async () => {
    setSaving(true);
    try {
      if (selected && selectedTeam) {
        await setFavoriteTeam(selected);
        // Spara i Supabase user_feed_config (ignorera fel — Clerk metadata är primärt)
        await fetch("/api/feed/config", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ followed_team_ids: [selectedTeam.id] }),
        }).catch(() => {});
      } else {
        markOnboardingDone();
      }
    } catch {
      // Spara aldrig fast — vi navigerar ändå
    }
    router.push("/feed");
  };

  const handleSkip = () => {
    markOnboardingDone();
    router.push("/feed");
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background px-4 py-8">
      <div className="w-full max-w-lg">
        {/* Header */}
        <motion.div
          className="mb-8 text-center"
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: "easeOut" }}
        >
          <h1 className="font-heading text-5xl text-foreground mb-2">VÄLJ DITT LAG</h1>
          <p className="text-muted-foreground text-sm max-w-xs mx-auto">
            Hela Athopia anpassas efter ditt lag — nyheter, statistik, forum och notiser.
          </p>
        </motion.div>

        {/* Team grid */}
        {loadFailed ? (
          <div className="py-10 text-center space-y-3">
            <p className="text-sm text-muted-foreground">
              Kunde inte ladda lagen just nu.
            </p>
            <p className="text-xs text-muted-foreground">
              Du kan välja lag senare under Konto → Inställningar.
            </p>
          </div>
        ) : teams.length === 0 ? (
          <div className="grid grid-cols-4 gap-3">
            {Array.from({ length: 16 }).map((_, i) => (
              <div key={i} className="h-20 rounded-xl bg-card skeleton-wave border border-border" />
            ))}
          </div>
        ) : (
          <motion.div
            className="grid grid-cols-4 gap-3"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
          >
            {teams.map((team, i) => {
              const color = getColor(team.metadata);
              const slug = team.slug ?? team.id;
              const isSelected = selected === slug;

              return (
                <motion.button
                  key={team.id}
                  onClick={() => {
                    const next = isSelected ? null : slug;
                    setSelected(next);
                    if (next) prefetchFeed(next);
                  }}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.02, duration: 0.25, ease: "easeOut" }}
                  whileTap={{ scale: 0.92 }}
                  aria-pressed={isSelected}
                  className="relative flex flex-col items-center justify-center h-20 rounded-xl border-2 text-xs font-medium text-center px-1 select-none touch-manipulation outline-none focus-visible:ring-2 focus-visible:ring-ring transition-colors"
                  style={{
                    borderColor: isSelected ? color : "var(--border)",
                    backgroundColor: isSelected ? color + "1A" : "var(--card)",
                  }}
                >
                  <span
                    className="text-xl font-bold leading-none mb-1 transition-colors"
                    style={{ color: isSelected ? color : "var(--muted-foreground)" }}
                  >
                    {getInitials(team.name)}
                  </span>
                  <span className="text-[10px] leading-tight line-clamp-2 text-muted-foreground">
                    {team.name}
                  </span>
                  <AnimatePresence>
                    {isSelected && (
                      <motion.span
                        initial={{ scale: 0, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0, opacity: 0 }}
                        transition={transitions.press}
                        className="absolute top-1.5 right-1.5 w-4 h-4 rounded-full flex items-center justify-center"
                        style={{ backgroundColor: color }}
                      >
                        <Check className="w-2.5 h-2.5 text-white" />
                      </motion.span>
                    )}
                  </AnimatePresence>
                </motion.button>
              );
            })}
          </motion.div>
        )}

        {/* Engagement preview — visas när ett lag är valt */}
        <AnimatePresence>
          {selectedTeam && (
            <motion.div
              initial={{ opacity: 0, height: 0, marginTop: 0 }}
              animate={{ opacity: 1, height: "auto", marginTop: 16 }}
              exit={{ opacity: 0, height: 0, marginTop: 0 }}
              transition={{ duration: 0.3, ease: "easeOut" }}
              className="overflow-hidden"
            >
              <div
                className="rounded-xl border p-4 space-y-3"
                style={{
                  borderColor: selectedColor + "40",
                  backgroundColor: selectedColor + "0D",
                }}
              >
                <p
                  className="text-xs font-semibold uppercase tracking-wider"
                  style={{ color: selectedColor }}
                >
                  Du får direkt tillgång till
                </p>
                <div className="grid grid-cols-1 gap-2">
                  {[
                    { icon: Zap, text: `Senaste nyheterna om ${selectedTeam.name}` },
                    { icon: Bell, text: "Push-notiser vid mål och transferrykten" },
                    { icon: ChevronRight, text: "Statistik, tabell och matchhistorik" },
                  ].map(({ icon: Icon, text }, i) => (
                    <div key={i} className="flex items-center gap-2.5 text-sm text-foreground/80">
                      <div
                        className="w-6 h-6 rounded-full flex items-center justify-center shrink-0"
                        style={{ backgroundColor: selectedColor + "25" }}
                      >
                        <Icon className="w-3 h-3" style={{ color: selectedColor }} />
                      </div>
                      {text}
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Actions */}
        <div className="mt-6 flex flex-col gap-3">
          <motion.button
            onClick={handleContinue}
            disabled={saving}
            whileTap={{ scale: 0.97 }}
            transition={transitions.press}
            className="w-full min-h-12 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition-colors touch-manipulation disabled:opacity-60"
            style={{
              backgroundColor: selected ? selectedColor : "var(--muted)",
              color: selected ? "white" : "var(--muted-foreground)",
            }}
          >
            {saving ? (
              "Sparar..."
            ) : selected && selectedTeam ? (
              <>
                Gå till {selectedTeam.name}-flödet
                <ArrowRight className="w-4 h-4" />
              </>
            ) : (
              "Välj ett lag ovan"
            )}
          </motion.button>

          <button
            onClick={handleSkip}
            className="min-h-11 text-sm text-muted-foreground hover:text-foreground transition-colors text-center touch-manipulation"
          >
            Hoppa över — välj senare
          </button>
        </div>
      </div>
    </div>
  );
}
