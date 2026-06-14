"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "motion/react";
import { Check, ArrowRight, Bell, Zap, ChevronRight, Sparkles } from "lucide-react";
import { useUser } from "@clerk/nextjs";
import { transitions } from "@/lib/motion";
import { useFavoriteTeam } from "@/hooks/useFavoriteTeam";
import { createClient } from "@supabase/supabase-js";

// ── Types ──────────────────────────────────────────────────────────────────────
interface Team {
  id: string;
  name: string;
  slug: string | null;
  metadata: Record<string, unknown> | null;
}

// ── Helpers ────────────────────────────────────────────────────────────────────
function getColor(metadata: Record<string, unknown> | null): string {
  return (metadata?.["primary_color"] as string | undefined) ?? "#1D9E75";
}
function getInitials(name: string): string {
  return name.split(" ").filter((w) => w.length > 1).map((w) => w[0]?.toUpperCase() ?? "").join("").slice(0, 3);
}

const AVATARS = ["⚽", "🏆", "🎯", "⚡", "🔥", "🦁", "🐺", "🦅", "🌟", "💎", "🏅", "🎪"];
const LOAD_TIMEOUT_MS = 8000;

// ── Fireworks particle ─────────────────────────────────────────────────────────
function Fireworks() {
  const particles = Array.from({ length: 40 }, (_, i) => ({
    id: i,
    angle: (i / 40) * 360,
    distance: 60 + Math.random() * 120,
    color: ["#1D9E75", "#25C48F", "#ffffff", "#ffd700", "#ff6b6b", "#74b9ff"][i % 6],
    size: 4 + Math.random() * 6,
    delay: Math.random() * 0.3,
  }));

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden" aria-hidden>
      {[
        { x: "50%", y: "40%" },
        { x: "25%", y: "55%" },
        { x: "75%", y: "50%" },
      ].map((origin, burst) =>
        particles.slice(burst * 10, burst * 10 + 10).map((p) => {
          const rad = (p.angle * Math.PI) / 180;
          const tx = Math.cos(rad) * p.distance;
          const ty = Math.sin(rad) * p.distance;
          return (
            <motion.div
              key={`${burst}-${p.id}`}
              className="absolute rounded-full"
              style={{ width: p.size, height: p.size, background: p.color, left: origin.x, top: origin.y, translateX: "-50%", translateY: "-50%" }}
              initial={{ x: 0, y: 0, opacity: 1, scale: 1 }}
              animate={{ x: tx, y: ty, opacity: 0, scale: 0 }}
              transition={{ duration: 0.9 + Math.random() * 0.4, delay: p.delay + burst * 0.15, ease: [0.23, 1, 0.32, 1] }}
            />
          );
        })
      )}
    </div>
  );
}

// ── Progress dots ──────────────────────────────────────────────────────────────
function Progress({ step, total }: { step: number; total: number }) {
  return (
    <div className="flex gap-1.5 justify-center" aria-label={`Steg ${step + 1} av ${total}`}>
      {Array.from({ length: total }, (_, i) => (
        <motion.div
          key={i}
          animate={{ width: i === step ? 20 : 6, opacity: i <= step ? 1 : 0.3 }}
          transition={{ duration: 0.3, ease: [0.23, 1, 0.32, 1] }}
          className="h-1.5 rounded-full bg-pitch"
        />
      ))}
    </div>
  );
}

// ── Slide wrapper ──────────────────────────────────────────────────────────────
const slideVariants = {
  enter: (dir: number) => ({ x: dir > 0 ? 48 : -48, opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit: (dir: number) => ({ x: dir > 0 ? -48 : 48, opacity: 0 }),
};

// ── Main component ─────────────────────────────────────────────────────────────
export function OnboardingClient() {
  const router = useRouter();
  const { user } = useUser();
  const { setFavoriteTeam, markOnboardingDone } = useFavoriteTeam();

  const [step, setStep] = useState(0);
  const [dir, setDir] = useState(1);
  const [showFireworks, setShowFireworks] = useState(false);

  // Step 1 — Team
  const [teams, setTeams] = useState<Team[]>([]);
  const [selectedTeam, setSelectedTeam] = useState<string | null>(null);
  const [loadFailed, setLoadFailed] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Step 2 — Profile
  const [nickname, setNickname] = useState(user?.username ?? user?.firstName ?? "");
  const [avatar, setAvatar] = useState(AVATARS[0]);

  // Step 3 — Done
  const [saving, setSaving] = useState(false);

  // Load teams
  useEffect(() => {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";
    if (!url || !key) { setLoadFailed(true); return; }
    timeoutRef.current = setTimeout(() => setLoadFailed(true), LOAD_TIMEOUT_MS);
    const db = createClient(url, key);
    void db.from("entities").select("id, name, slug, metadata").eq("type", "team").order("name")
      .then(({ data, error }) => {
        if (timeoutRef.current) { clearTimeout(timeoutRef.current); timeoutRef.current = null; }
        if (error || !data || data.length === 0) { setLoadFailed(true); return; }
        const filtered = (data as Team[]).filter((t) => (t.metadata?.["league"] as string | undefined) === "Allsvenskan");
        setTeams(filtered.length > 0 ? filtered : (data as Team[]));
      });
    return () => { if (timeoutRef.current) clearTimeout(timeoutRef.current); };
  }, []);

  const teamObj = teams.find((t) => (t.slug ?? t.id) === selectedTeam);
  const teamColor = teamObj ? getColor(teamObj.metadata) : "#1D9E75";

  const prefetchFeed = useCallback((slug: string) => {
    void fetch(`/api/feed?team=${encodeURIComponent(slug)}&offset=0`, { cache: "no-store" })
      .then((r) => r.ok ? r.json() : null)
      .then((data) => { if (data) { try { sessionStorage.setItem("prefetch_feed", JSON.stringify({ slug, data, ts: Date.now() })); } catch {} } });
  }, []);

  const goTo = (next: number) => {
    setDir(next > step ? 1 : -1);
    setStep(next);
  };

  const handleFinish = async (skip = false) => {
    setSaving(true);
    try {
      if (selectedTeam && teamObj) {
        await setFavoriteTeam(selectedTeam);
        await fetch("/api/feed/config", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ followed_team_ids: [teamObj.id] }),
        }).catch(() => {});
      } else {
        markOnboardingDone();
      }
      if (nickname.trim()) {
        await user?.update({ username: nickname.trim() }).catch(() => {});
      }
    } catch {}
    if (skip) { router.push("/feed"); return; }
    router.push("/feed");
  };

  const TOTAL = 3;

  return (
    <div className="min-h-dvh flex flex-col bg-background">
      {/* Top bar */}
      <div className="flex items-center justify-between px-5 pt-safe-top pt-6 pb-4">
        <Progress step={step} total={TOTAL} />
        <button
          onClick={() => handleFinish(true)}
          className="text-xs text-muted-foreground hover:text-foreground transition-colors touch-manipulation min-h-[44px] flex items-center"
        >
          Hoppa över
        </button>
      </div>

      {/* Step content */}
      <div className="flex-1 overflow-hidden relative">
        <AnimatePresence custom={dir} mode="wait">
          {step === 0 && (
            <motion.div
              key="step-0"
              custom={dir}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.32, ease: [0.23, 1, 0.32, 1] }}
              className="absolute inset-0 flex flex-col items-center justify-center px-6 text-center"
            >
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.1, duration: 0.5, ease: [0.23, 1, 0.32, 1] }}
                className="w-20 h-20 rounded-3xl bg-pitch/15 border border-pitch/30 flex items-center justify-center mb-8"
              >
                <span className="text-4xl">⚽</span>
              </motion.div>
              <motion.h1
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2, duration: 0.4 }}
                className="font-heading text-5xl text-foreground mb-4 leading-tight"
              >
                Välkommen till<br />Athopia
              </motion.h1>
              <motion.p
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3, duration: 0.4 }}
                className="text-muted-foreground text-base max-w-xs leading-relaxed mb-10"
              >
                Fotboll djupare. Låt oss anpassa allt efter dig — det tar 30 sekunder.
              </motion.p>
              <motion.button
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4, duration: 0.4 }}
                whileTap={{ scale: 0.96 }}
                onClick={() => goTo(1)}
                className="w-full max-w-xs min-h-[54px] rounded-2xl bg-pitch text-white font-semibold text-base flex items-center justify-center gap-2 touch-manipulation"
              >
                Kom igång <ArrowRight className="w-4 h-4" />
              </motion.button>
            </motion.div>
          )}

          {step === 1 && (
            <motion.div
              key="step-1"
              custom={dir}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.32, ease: [0.23, 1, 0.32, 1] }}
              className="absolute inset-0 flex flex-col px-5 pt-4 pb-8 overflow-y-auto"
            >
              <div className="mb-6">
                <h2 className="font-heading text-4xl text-foreground mb-2">Välj ditt lag</h2>
                <p className="text-muted-foreground text-sm">Nyheter, statistik och notiser anpassas direkt.</p>
              </div>

              {loadFailed ? (
                <div className="py-10 text-center text-sm text-muted-foreground">
                  Kunde inte ladda lagen. Du kan välja senare under Inställningar.
                </div>
              ) : teams.length === 0 ? (
                <div className="grid grid-cols-4 gap-2.5">
                  {Array.from({ length: 16 }).map((_, i) => (
                    <div key={i} className="h-20 rounded-xl bg-card skeleton-wave border border-border" />
                  ))}
                </div>
              ) : (
                <motion.div className="grid grid-cols-4 gap-2.5" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }}>
                  {teams.map((team, i) => {
                    const color = getColor(team.metadata);
                    const slug = team.slug ?? team.id;
                    const isSelected = selectedTeam === slug;
                    return (
                      <motion.button
                        key={team.id}
                        onClick={() => { const next = isSelected ? null : slug; setSelectedTeam(next); if (next) prefetchFeed(next); }}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.018, duration: 0.25, ease: "easeOut" }}
                        whileTap={{ scale: 0.91 }}
                        aria-pressed={isSelected}
                        className="relative flex flex-col items-center justify-center h-20 rounded-xl border-2 text-xs font-medium text-center px-1 select-none touch-manipulation outline-none focus-visible:ring-2 focus-visible:ring-ring transition-colors"
                        style={{ borderColor: isSelected ? color : "var(--border)", backgroundColor: isSelected ? color + "1A" : "var(--card)" }}
                      >
                        <span className="text-xl font-bold leading-none mb-1 transition-colors" style={{ color: isSelected ? color : "var(--muted-foreground)" }}>
                          {getInitials(team.name)}
                        </span>
                        <span className="text-[10px] leading-tight line-clamp-2 text-muted-foreground">{team.name}</span>
                        <AnimatePresence>
                          {isSelected && (
                            <motion.span
                              initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0, opacity: 0 }}
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

              {/* Preview */}
              <AnimatePresence>
                {teamObj && (
                  <motion.div
                    initial={{ opacity: 0, height: 0, marginTop: 0 }}
                    animate={{ opacity: 1, height: "auto", marginTop: 16 }}
                    exit={{ opacity: 0, height: 0, marginTop: 0 }}
                    transition={{ duration: 0.3, ease: "easeOut" }}
                    className="overflow-hidden"
                  >
                    <div className="rounded-xl border p-4 space-y-2.5" style={{ borderColor: teamColor + "40", backgroundColor: teamColor + "0D" }}>
                      <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: teamColor }}>Du får direkt</p>
                      {[
                        { icon: Zap, text: `Senaste om ${teamObj.name}` },
                        { icon: Bell, text: "Push-notiser vid mål & transfers" },
                        { icon: ChevronRight, text: "Statistik, tabell & matchhistorik" },
                      ].map(({ icon: Icon, text }, i) => (
                        <div key={i} className="flex items-center gap-2.5 text-sm text-foreground/80">
                          <div className="w-6 h-6 rounded-full flex items-center justify-center shrink-0" style={{ backgroundColor: teamColor + "25" }}>
                            <Icon className="w-3 h-3" style={{ color: teamColor }} />
                          </div>
                          {text}
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="mt-6 flex flex-col gap-3">
                <motion.button
                  onClick={() => goTo(2)}
                  disabled={!selectedTeam && teams.length > 0 && !loadFailed}
                  whileTap={{ scale: 0.97 }}
                  className="w-full min-h-[54px] rounded-2xl text-sm font-semibold flex items-center justify-center gap-2 touch-manipulation transition-colors disabled:opacity-40"
                  style={{ backgroundColor: selectedTeam ? teamColor : "var(--muted)", color: selectedTeam ? "white" : "var(--muted-foreground)" }}
                >
                  {selectedTeam && teamObj ? `Fortsätt med ${teamObj.name}` : "Välj ett lag ovan"}
                  {selectedTeam && <ArrowRight className="w-4 h-4" />}
                </motion.button>
                <button onClick={() => goTo(2)} className="min-h-[44px] text-sm text-muted-foreground hover:text-foreground transition-colors text-center touch-manipulation">
                  Välj senare
                </button>
              </div>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div
              key="step-2"
              custom={dir}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.32, ease: [0.23, 1, 0.32, 1] }}
              className="absolute inset-0 flex flex-col px-5 pt-4 pb-8"
            >
              <div className="mb-8">
                <h2 className="font-heading text-4xl text-foreground mb-2">Din profil</h2>
                <p className="text-muted-foreground text-sm">Välj ett avatar och nickname — syns i forum.</p>
              </div>

              {/* Avatar grid */}
              <div className="mb-8">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">Välj avatar</p>
                <div className="grid grid-cols-6 gap-2.5">
                  {AVATARS.map((em) => (
                    <motion.button
                      key={em}
                      onClick={() => setAvatar(em)}
                      whileTap={{ scale: 0.88 }}
                      className="h-12 w-full rounded-xl border-2 flex items-center justify-center text-2xl touch-manipulation transition-colors"
                      style={{ borderColor: avatar === em ? "#1D9E75" : "var(--border)", backgroundColor: avatar === em ? "rgba(29,158,117,0.12)" : "var(--card)" }}
                    >
                      {em}
                    </motion.button>
                  ))}
                </div>
              </div>

              {/* Nickname */}
              <div className="mb-8">
                <label htmlFor="nickname" className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3 block">
                  Nickname
                </label>
                <div className="relative">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-2xl pointer-events-none">{avatar}</div>
                  <input
                    id="nickname"
                    type="text"
                    value={nickname}
                    onChange={(e) => setNickname(e.target.value.slice(0, 24))}
                    placeholder="ditt-nickname"
                    maxLength={24}
                    autoComplete="nickname"
                    className="w-full min-h-[54px] rounded-2xl border border-border bg-card text-foreground pl-14 pr-4 text-base outline-none focus:border-pitch focus:ring-2 focus:ring-pitch/20 transition-all"
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">{nickname.length}/24</span>
                </div>
              </div>

              <div className="mt-auto flex flex-col gap-3">
                <motion.button
                  onClick={async () => {
                    setShowFireworks(true);
                    setTimeout(() => setShowFireworks(false), 1200);
                    await new Promise((r) => setTimeout(r, 800));
                    goTo(3);
                  }}
                  disabled={!nickname.trim()}
                  whileTap={{ scale: 0.97 }}
                  className="w-full min-h-[54px] rounded-2xl bg-pitch text-white font-semibold text-base flex items-center justify-center gap-2 touch-manipulation disabled:opacity-40 relative overflow-hidden"
                >
                  <Sparkles className="w-4 h-4" />
                  Ser bra ut!
                  {showFireworks && <Fireworks />}
                </motion.button>
                <button onClick={() => goTo(1)} className="min-h-[44px] text-sm text-muted-foreground hover:text-foreground transition-colors text-center touch-manipulation">
                  ← Tillbaka
                </button>
              </div>
            </motion.div>
          )}

          {step === 3 && (
            <motion.div
              key="step-3"
              custom={dir}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.32, ease: [0.23, 1, 0.32, 1] }}
              className="absolute inset-0 flex flex-col items-center justify-center px-6 text-center"
            >
              <motion.div
                initial={{ scale: 0.5, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.5, ease: [0.23, 1, 0.32, 1] }}
                className="text-6xl mb-6"
              >
                {avatar}
              </motion.div>
              <motion.h2
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15, duration: 0.4 }}
                className="font-heading text-4xl text-foreground mb-3"
              >
                {nickname ? `Hej, ${nickname}!` : "Klart!"}
              </motion.h2>
              <motion.p
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.25, duration: 0.4 }}
                className="text-muted-foreground text-base max-w-xs leading-relaxed mb-10"
              >
                {teamObj
                  ? `Ditt ${teamObj.name}-flöde är redo. Uppgradera till PRO för obegränsat innehåll och AI-analyser.`
                  : "Ditt flöde är redo. Uppgradera till PRO för obegränsat innehåll."}
              </motion.p>
              <div className="w-full max-w-xs flex flex-col gap-3">
                <motion.button
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.35, duration: 0.4 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={async () => { await handleFinish(); router.push("/prenumerera"); }}
                  disabled={saving}
                  className="w-full min-h-[54px] rounded-2xl bg-pitch text-white font-semibold text-base flex items-center justify-center gap-2 touch-manipulation disabled:opacity-60"
                >
                  <Zap className="w-4 h-4" />
                  Uppgradera till PRO
                </motion.button>
                <motion.button
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.5, duration: 0.4 }}
                  onClick={() => handleFinish()}
                  disabled={saving}
                  className="w-full min-h-[44px] text-sm text-muted-foreground hover:text-foreground transition-colors touch-manipulation disabled:opacity-50"
                >
                  {saving ? "Sparar..." : "Till mitt flöde →"}
                </motion.button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
