"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "motion/react";
import {
  Check, ArrowRight, Bell, Zap, ChevronRight,
  Camera, Loader2, Crown,
} from "lucide-react";
import { useUser } from "@clerk/nextjs";
import { transitions } from "@/lib/motion";
import { useFavoriteTeam } from "@/hooks/useFavoriteTeam";
import { createClient } from "@/lib/supabase";
import {
  PRICING, amountFor, formatKr, monthlyEquivalent,
  type PaidPlan, type BillingInterval,
} from "@/lib/pricing";

// ── Types ──────────────────────────────────────────────────────────────────────
interface Team {
  id: string;
  name: string;
  slug: string | null;
  metadata: Record<string, unknown> | null;
}

// ── Helpers ────────────────────────────────────────────────────────────────────
function getColor(metadata: Record<string, unknown> | null): string {
  return (metadata?.["primary_color"] as string | undefined) ?? "var(--color-pitch)";
}
function getInitials(name: string): string {
  return name.split(" ").filter((w) => w.length > 1).map((w) => w[0]?.toUpperCase() ?? "").join("").slice(0, 3);
}

const LOAD_TIMEOUT_MS = 8000;
const TOTAL_STEPS = 5; // 0=välkommen 1=lag 2=intressen 3=profil 4=uppgradera

const INTEREST_OPTIONS = [
  { id: "transfer", label: "Transfers" },
  { id: "analysis", label: "Taktik & analys" },
  { id: "match", label: "Matchrapport" },
  { id: "statistics", label: "Statistik & xG" },
  { id: "injury", label: "Skador" },
  { id: "table", label: "Tabeller" },
] as const;
type InterestId = typeof INTEREST_OPTIONS[number]["id"];

// ── Image compress ─────────────────────────────────────────────────────────────
async function compressImage(file: File, maxPx = 320, quality = 0.55): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      const scale = Math.min(1, maxPx / Math.max(img.width, img.height));
      const w = Math.round(img.width * scale);
      const h = Math.round(img.height * scale);
      const canvas = document.createElement("canvas");
      canvas.width = w; canvas.height = h;
      canvas.getContext("2d")!.drawImage(img, 0, 0, w, h);
      canvas.toBlob((b) => b ? resolve(b) : reject(new Error("compress failed")), "image/jpeg", quality);
    };
    img.onerror = reject;
    img.src = url;
  });
}

// ── Fireworks particle ─────────────────────────────────────────────────────────
function Fireworks() {
  const particles = Array.from({ length: 40 }, (_, i) => ({
    id: i,
    angle: (i / 40) * 360,
    distance: 60 + Math.random() * 120,
    color: ["var(--color-pitch)", "#25C48F", "#ffffff", "#ffd700", "#ff6b6b", "#74b9ff"][i % 6],
    size: 4 + Math.random() * 6,
    delay: Math.random() * 0.3,
  }));
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden" aria-hidden>
      {[{ x: "50%", y: "40%" }, { x: "25%", y: "55%" }, { x: "75%", y: "50%" }].map((origin, burst) =>
        particles.slice(burst * 13, burst * 13 + 13).map((p) => {
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

// ── Progress bar (thin, Revolut-style) ───────────────────────────────────────
function Progress({ step, total }: { step: number; total: number }) {
  const pct = ((step + 1) / total) * 100;
  return (
    <div
      className="flex-1 h-[3px] bg-white/10 rounded-full overflow-hidden"
      role="progressbar"
      aria-valuenow={step + 1}
      aria-valuemin={1}
      aria-valuemax={total}
      aria-label={`Steg ${step + 1} av ${total}`}
    >
      <motion.div
        className="h-full bg-pitch rounded-full"
        animate={{ width: `${pct}%` }}
        transition={{ duration: 0.45, ease: [0.23, 1, 0.32, 1] }}
      />
    </div>
  );
}

// ── Slide wrapper ──────────────────────────────────────────────────────────────
const slideVariants = {
  enter: (dir: number) => ({ x: dir > 0 ? 48 : -48, opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit: (dir: number) => ({ x: dir > 0 ? -48 : 48, opacity: 0 }),
};

// ── Avatar circle ──────────────────────────────────────────────────────────────
function AvatarCircle({ src, size = 96 }: { src: string | null; size?: number }) {
  return (
    <div
      className="rounded-full bg-card border-2 border-pitch/30 overflow-hidden flex items-center justify-center shrink-0"
      style={{ width: size, height: size }}
    >
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={src} alt="Profilbild" className="w-full h-full object-cover" />
      ) : (
        <Camera className="w-8 h-8 text-muted-foreground" />
      )}
    </div>
  );
}

// ── Checkout helper (reuse from existing route) ────────────────────────────────
async function startCheckout(plan: PaidPlan, interval: BillingInterval): Promise<void> {
  const res = await fetch("/api/create-checkout", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ plan, interval }),
  });
  const { url, error } = (await res.json()) as { url?: string; error?: string };
  if (url) window.location.href = url;
  else throw new Error(error ?? "Okänt fel");
}

// ── Main component ─────────────────────────────────────────────────────────────
export function OnboardingClient() {
  const router = useRouter();
  const { user } = useUser();
  const { setFavoriteTeam, markOnboardingDone } = useFavoriteTeam();

  const [step, setStep] = useState(0);
  const [dir, setDir] = useState(1);
  const [showFireworks, setShowFireworks] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  // Step 1 — Team
  const [teams, setTeams] = useState<Team[]>([]);
  const [selectedTeam, setSelectedTeam] = useState<string | null>(null);
  const [loadFailed, setLoadFailed] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Step 2 — Profile
  const [nickname, setNickname] = useState("");
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [avatarBlob, setAvatarBlob] = useState<Blob | null>(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const avatarPreviewRef = useRef<string | null>(null);

  // Step 2 — Interests
  const [selectedInterests, setSelectedInterests] = useState<InterestId[]>([]);

  // Step 4 — Plan
  const [selectedPlan, setSelectedPlan] = useState<PaidPlan>("pro");
  const [billingInterval, setBillingInterval] = useState<BillingInterval>("month");
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);

  const [saving, setSaving] = useState(false);

  // Revoke avatar object URL vid unmount
  useEffect(() => {
    return () => {
      if (avatarPreviewRef.current) URL.revokeObjectURL(avatarPreviewRef.current);
    };
  }, []);

  // Prefill nickname from Clerk
  useEffect(() => {
    if (user && !nickname) {
      setNickname(user.username ?? user.firstName ?? "");
    }
  }, [user, nickname]);

  // Load teams
  useEffect(() => {
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) { setLoadFailed(true); return; }
    timeoutRef.current = setTimeout(() => setLoadFailed(true), LOAD_TIMEOUT_MS);
    const db = createClient();
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
  const teamColor = teamObj ? getColor(teamObj.metadata) : "var(--color-pitch)";

  const prefetchFeed = useCallback((slug: string) => {
    void fetch(`/api/feed?team=${encodeURIComponent(slug)}&offset=0`, { cache: "no-store" })
      .then((r) => r.ok ? r.json() : null)
      .then((data) => { if (data) { try { sessionStorage.setItem("prefetch_feed", JSON.stringify({ slug, data, ts: Date.now() })); } catch {} } });
  }, []);

  const goTo = (next: number) => {
    setDir(next > step ? 1 : -1);
    setStep(next);
  };

  // Image pick + compress
  async function handleImagePick(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const blob = await compressImage(file, 320, 0.55);
      if (avatarPreviewRef.current) URL.revokeObjectURL(avatarPreviewRef.current);
      const url = URL.createObjectURL(blob);
      avatarPreviewRef.current = url;
      setAvatarBlob(blob);
      setAvatarPreview(url);
    } catch {
      // Fallback: använd original
      if (avatarPreviewRef.current) URL.revokeObjectURL(avatarPreviewRef.current);
      const url = URL.createObjectURL(file);
      avatarPreviewRef.current = url;
      setAvatarBlob(file);
      setAvatarPreview(url);
    }
  }

  // Upload avatar via Clerk setProfileImage
  async function uploadAvatar(): Promise<string | null> {
    if (!avatarBlob || !user) return null;
    setUploadingAvatar(true);
    try {
      const file = new File([avatarBlob], "avatar.jpg", { type: "image/jpeg" });
      const res = await user.setProfileImage({ file });
      return res.publicUrl ?? user.imageUrl;
    } catch {
      return null;
    } finally {
      setUploadingAvatar(false);
    }
  }

  const handleSaveProfile = async (): Promise<boolean> => {
    setSaving(true);
    setSaveError(null);
    try {
      const avatarUrl = await uploadAvatar();

      if (selectedTeam && teamObj) {
        await setFavoriteTeam(selectedTeam);
        await fetch("/api/feed/config", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            followed_team_ids: [teamObj.id],
            ...(selectedInterests.length > 0 ? { content_types: selectedInterests } : {}),
          }),
        }).catch(() => {});
      } else {
        markOnboardingDone();
      }

      const body: Record<string, string> = {};
      if (nickname.trim()) body["nickname"] = nickname.trim();
      if (avatarUrl) body["avatar_url"] = avatarUrl;
      if (Object.keys(body).length > 0) {
        const res = await fetch("/api/profile", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
        if (!res.ok) {
          const data = (await res.json().catch(() => ({}))) as { error?: string };
          throw new Error(data.error ?? "Kunde inte spara profil");
        }
      }
      if (nickname.trim()) {
        await user?.update({ username: nickname.trim() }).catch(() => {});
      }
      return true;
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Något gick fel";
      console.error("[onboarding] handleSaveProfile:", msg);
      setSaveError(msg);
      return false;
    } finally {
      setSaving(false);
    }
  };

  const handleCheckout = async () => {
    setCheckoutLoading(true);
    setCheckoutError(null);
    await handleSaveProfile();
    // Fortsätt till Stripe även om profil-sparning delvis misslyckades
    try {
      await startCheckout(selectedPlan, billingInterval);
    } catch (err) {
      setCheckoutError(err instanceof Error ? err.message : "Något gick fel");
      setCheckoutLoading(false);
    }
  };

  const handleFreeFinish = async () => {
    const ok = await handleSaveProfile();
    if (ok) router.push("/profil?welcome=1");
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-background">
      {/* Top bar */}
      <div className="flex items-center gap-4 px-5 pt-[env(safe-area-inset-top,0px)] pt-6 pb-4 shrink-0">
        <Progress step={step} total={TOTAL_STEPS} />
        {step > 0 && (
          <button
            onClick={handleFreeFinish}
            disabled={saving}
            className="text-xs text-muted-foreground hover:text-foreground transition-colors touch-manipulation min-h-[44px] flex items-center shrink-0 disabled:opacity-50"
          >
            Hoppa över
          </button>
        )}
      </div>

      {/* Step content */}
      <div className="flex-1 overflow-hidden relative">
        <AnimatePresence custom={dir} mode="wait">

          {/* ── STEG 0: Välkommen ── */}
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
                className="w-24 h-24 rounded-3xl bg-pitch/15 border border-pitch/30 flex items-center justify-center mb-8"
              >
                <span className="text-5xl">⚽</span>
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
                Fotboll djupare. Anpassat efter dig — det tar 30 sekunder.
              </motion.p>
              <motion.button
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4, duration: 0.4 }}
                whileTap={{ scale: 0.96 }}
                onClick={() => goTo(1)}
                className="w-full max-w-xs min-h-[54px] rounded-2xl pitch-gradient text-white font-semibold text-base flex items-center justify-center gap-2 touch-manipulation"
              >
                Kom igång <ArrowRight className="w-4 h-4" />
              </motion.button>
            </motion.div>
          )}

          {/* ── STEG 1: Välj lag ── */}
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

          {/* ── STEG 2: Intressen ── */}
          {step === 2 && (
            <motion.div
              key="step-2"
              custom={dir}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.32, ease: [0.23, 1, 0.32, 1] }}
              className="absolute inset-0 flex flex-col px-5 pt-4 pb-8 overflow-y-auto"
            >
              <div className="mb-8">
                <h2 className="font-heading text-4xl text-foreground mb-2">Vad följer du?</h2>
                <p className="text-muted-foreground text-sm">Välj det du bryr dig om — flödet anpassas direkt.</p>
              </div>

              <motion.div
                className="flex flex-wrap gap-2.5"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3 }}
              >
                {INTEREST_OPTIONS.map(({ id, label }, i) => {
                  const active = selectedInterests.includes(id);
                  return (
                    <motion.button
                      key={id}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: i * 0.04, duration: 0.25, ease: [0.23, 1, 0.32, 1] }}
                      whileTap={{ scale: 0.93 }}
                      onClick={() =>
                        setSelectedInterests((prev) =>
                          active ? prev.filter((x) => x !== id) : [...prev, id]
                        )
                      }
                      aria-pressed={active}
                      className={[
                        "h-11 px-5 rounded-full text-sm font-medium border-2 transition-colors touch-manipulation",
                        active
                          ? "border-pitch bg-pitch/15 text-pitch"
                          : "border-border bg-card text-muted-foreground hover:border-pitch/40 hover:text-foreground",
                      ].join(" ")}
                    >
                      {label}
                    </motion.button>
                  );
                })}
              </motion.div>

              <div className="mt-auto flex flex-col gap-3 pt-8">
                <motion.button
                  onClick={() => goTo(3)}
                  whileTap={{ scale: 0.97 }}
                  className="w-full min-h-[54px] rounded-2xl pitch-gradient text-white font-semibold text-base flex items-center justify-center gap-2 touch-manipulation"
                >
                  {selectedInterests.length > 0 ? "Fortsätt" : "Hoppa över"} <ArrowRight className="w-4 h-4" />
                </motion.button>
              </div>
            </motion.div>
          )}

          {/* ── STEG 3: Din profil ── */}
          {step === 3 && (
            <motion.div
              key="step-2"
              custom={dir}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.32, ease: [0.23, 1, 0.32, 1] }}
              className="absolute inset-0 flex flex-col px-5 pt-4 pb-8 overflow-y-auto"
            >
              <div className="mb-8">
                <h2 className="font-heading text-4xl text-foreground mb-2">Din profil</h2>
                <p className="text-muted-foreground text-sm">Visas i forumet och på din profilsida.</p>
              </div>

              {/* Avatar upload */}
              <div className="mb-8">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-4">Profilbild</p>
                <div className="flex items-center gap-5">
                  <AvatarCircle src={avatarPreview} size={80} />
                  <div className="flex flex-col gap-2">
                    <button
                      onClick={() => fileRef.current?.click()}
                      disabled={uploadingAvatar}
                      className="h-10 px-4 rounded-xl border border-border bg-card text-sm font-medium text-foreground hover:border-pitch/50 transition-colors touch-manipulation flex items-center gap-2 disabled:opacity-60"
                    >
                      {uploadingAvatar ? <Loader2 className="w-4 h-4 animate-spin" /> : <Camera className="w-4 h-4" />}
                      Lägg upp profilbild
                    </button>
                    <p className="text-[11px] text-muted-foreground/70">Komprimeras automatiskt · Max 5 MB</p>
                  </div>
                </div>
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleImagePick}
                />
              </div>

              {/* Nickname */}
              <div className="mb-8">
                <label htmlFor="nickname" className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3 block">
                  Nickname
                </label>
                <input
                  id="nickname"
                  type="text"
                  value={nickname}
                  onChange={(e) => setNickname(e.target.value.slice(0, 20))}
                  placeholder="ditt-nickname"
                  maxLength={20}
                  autoComplete="nickname"
                  className="w-full min-h-[54px] rounded-2xl border border-border bg-card text-foreground px-4 text-base outline-none focus:border-pitch focus:ring-2 focus:ring-pitch/20 transition-all"
                />
                <div className="flex justify-end mt-1">
                  <span className="text-xs text-muted-foreground">{nickname.length}/20</span>
                </div>
              </div>

              {saveError && (
                <p className="text-sm text-red-400 text-center mb-2">{saveError}</p>
              )}

              <div className="mt-auto flex flex-col gap-3">
                <motion.button
                  onClick={async () => {
                    await handleSaveProfile();
                    setShowFireworks(true);
                    setTimeout(() => setShowFireworks(false), 1200);
                    await new Promise((r) => setTimeout(r, 400));
                    goTo(4);
                  }}
                  whileTap={{ scale: 0.97 }}
                  className="relative overflow-hidden w-full min-h-[54px] rounded-2xl pitch-gradient text-white font-semibold text-base flex items-center justify-center gap-2 touch-manipulation"
                >
                  Ser bra ut! <ArrowRight className="w-4 h-4" />
                  {showFireworks && <Fireworks />}
                </motion.button>
                <button onClick={() => goTo(2)} className="min-h-[44px] text-sm text-muted-foreground hover:text-foreground transition-colors text-center touch-manipulation">
                  ← Tillbaka
                </button>
              </div>
            </motion.div>
          )}

          {/* ── STEG 4: Välj plan ── */}
          {step === 4 && (
            <motion.div
              key="step-4"
              custom={dir}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.32, ease: [0.23, 1, 0.32, 1] }}
              className="absolute inset-0 flex flex-col px-5 pt-4 pb-8 overflow-y-auto"
            >
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
                className="mb-6"
              >
                <div className="inline-flex items-center gap-1.5 rounded-full border border-pitch/40 bg-pitch/10 px-3 py-1 mb-3">
                  <Crown className="w-3.5 h-3.5 text-pitch" />
                  <span className="text-xs font-semibold text-pitch uppercase tracking-wide">Athopia Premium</span>
                </div>
                <h2 className="font-heading text-4xl text-foreground mb-2">Välj din nivå</h2>
                <p className="text-muted-foreground text-sm">Obegränsat flöde, AI-analys och exklusivt djupinnehåll.</p>
              </motion.div>

              {/* Betalningsintervall */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.1, duration: 0.3 }}
                className="flex items-center self-start rounded-full border border-border bg-card p-1 mb-6"
              >
                {(["month", "year"] as BillingInterval[]).map((iv) => (
                  <button
                    key={iv}
                    onClick={() => setBillingInterval(iv)}
                    className={[
                      "px-4 py-1.5 rounded-full text-sm font-medium transition-colors",
                      billingInterval === iv ? "pitch-gradient text-white" : "text-muted-foreground hover:text-foreground",
                    ].join(" ")}
                  >
                    {iv === "month" ? "Månadsvis" : <>Årsvis <span className="text-pitch-light">−25 %</span></>}
                  </button>
                ))}
              </motion.div>

              {/* Plan-kort */}
              <div className="flex flex-col gap-4 mb-6">
                {(["pro", "elite"] as PaidPlan[]).map((plan, idx) => {
                  const isSelected = selectedPlan === plan;
                  const amount = amountFor(plan, billingInterval);
                  const perMonth = billingInterval === "year" ? monthlyEquivalent(plan) : null;
                  return (
                    <motion.button
                      key={plan}
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.15 + idx * 0.08, duration: 0.3, ease: "easeOut" }}
                      onClick={() => setSelectedPlan(plan)}
                      className={[
                        "relative w-full rounded-2xl border-2 p-5 text-left transition-all touch-manipulation",
                        isSelected ? "border-pitch bg-pitch/8" : "border-border bg-card hover:border-pitch/40",
                      ].join(" ")}
                    >
                      {plan === "pro" && (
                        <span className="absolute -top-2.5 left-4 px-2.5 py-0.5 rounded-full pitch-gradient text-white text-[11px] font-semibold">
                          Populärast
                        </span>
                      )}
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <p className="font-heading text-xl text-foreground">{PRICING[plan].label}</p>
                          <div className="flex items-baseline gap-1 mt-0.5">
                            <span className="text-3xl font-heading text-foreground">{amount / 100}</span>
                            <span className="text-muted-foreground text-sm">kr/{billingInterval === "year" ? "år" : "mån"}</span>
                          </div>
                          {perMonth && (
                            <p className="text-xs text-pitch mt-0.5">Motsvarar {formatKr(perMonth)}/mån · spara 25 %</p>
                          )}
                        </div>
                        <div
                          className={[
                            "w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 mt-1 transition-colors",
                            isSelected ? "border-pitch bg-pitch" : "border-border",
                          ].join(" ")}
                        >
                          {isSelected && <Check className="w-3.5 h-3.5 text-white" />}
                        </div>
                      </div>
                      <ul className="space-y-1.5">
                        {(plan === "pro"
                          ? ["Obegränsat flöde", "AI-sammanfattningar", "Avancerade filter", "Push-notiser", "Forum (skriva)"]
                          : ["Allt i PRO", "Cross-source clustering", "Trend detection", "Export / API (kommande)"]
                        ).map((feat) => (
                          <li key={feat} className="flex items-center gap-2 text-xs text-foreground/80">
                            <Check className="w-3.5 h-3.5 text-pitch shrink-0" />
                            {feat}
                          </li>
                        ))}
                      </ul>
                    </motion.button>
                  );
                })}
              </div>

              {/* Error */}
              {checkoutError && (
                <p className="text-sm text-red-400 text-center mb-3">{checkoutError}</p>
              )}

              {/* CTA */}
              <motion.button
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.35, duration: 0.3 }}
                onClick={handleCheckout}
                disabled={checkoutLoading || saving}
                whileTap={{ scale: 0.97 }}
                className="w-full min-h-[54px] rounded-2xl pitch-gradient text-white font-semibold text-base flex items-center justify-center gap-2 touch-manipulation disabled:opacity-60"
              >
                {checkoutLoading ? (
                  <><Loader2 className="w-4 h-4 animate-spin" /> Laddar Stripe…</>
                ) : (
                  <><Zap className="w-4 h-4" /> Fortsätt med {PRICING[selectedPlan].label}</>
                )}
              </motion.button>

              <p className="text-[11px] text-muted-foreground/60 text-center mt-2 mb-1">
                Betalning via Stripe · SSL · Avbryt när som helst
              </p>

              <motion.button
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5, duration: 0.3 }}
                onClick={handleFreeFinish}
                disabled={saving}
                className="w-full min-h-[44px] text-sm text-muted-foreground hover:text-foreground transition-colors text-center touch-manipulation disabled:opacity-50"
              >
                {saving ? "Sparar…" : "Fortsätt med gratiskonto →"}
              </motion.button>
            </motion.div>
          )}

        </AnimatePresence>
      </div>
    </div>
  );
}
