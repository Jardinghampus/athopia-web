"use client";

/**
 * Onboarding — 3 steg (LAUNCH-06):
 * 1) Välj lag → 2) Se riktig värdepreview → 3) Notiser (valfritt)
 * Upgrade flyttas till efter demonstrerat värde (/prenumerera).
 */

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "motion/react";
import { ArrowRight, Bell, Check, Loader2 } from "lucide-react";
import { useFavoriteTeam } from "@/hooks/useFavoriteTeam";
import { createClient } from "@/lib/supabase";

interface Team {
  id: string;
  name: string;
  slug: string | null;
  metadata: Record<string, unknown> | null;
}

type Preview = {
  team: { name: string; slug: string };
  position: number | null;
  form: ("W" | "D" | "L")[];
  nextMatch: { home: string; away: string; kickoffAt: string } | null;
  news: { id: string; title: string }[];
};

const TOTAL_STEPS = 3;
const LOAD_TIMEOUT_MS = 8000;

const slideVariants = {
  enter: (dir: number) => ({ x: dir > 0 ? 40 : -40, opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit: (dir: number) => ({ x: dir > 0 ? -40 : 40, opacity: 0 }),
};

function Progress({ step, total }: { step: number; total: number }) {
  return (
    <div className="flex-1 flex gap-1.5" aria-hidden>
      {Array.from({ length: total }, (_, i) => (
        <div
          key={i}
          className={`h-1 flex-1 rounded-full transition-colors ${
            i <= step ? "bg-pitch" : "bg-border"
          }`}
        />
      ))}
    </div>
  );
}

function formatKickoff(iso: string): string {
  return new Date(iso).toLocaleString("sv-SE", {
    timeZone: "Europe/Stockholm",
    weekday: "short",
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function OnboardingClient() {
  const router = useRouter();
  const { setFavoriteTeam, markOnboardingDone } = useFavoriteTeam();

  const [step, setStep] = useState(0);
  const [dir, setDir] = useState(1);
  const [teams, setTeams] = useState<Team[]>([]);
  const [selectedTeam, setSelectedTeam] = useState<string | null>(null);
  const [loadFailed, setLoadFailed] = useState(false);
  const [saving, setSaving] = useState(false);
  const [preview, setPreview] = useState<Preview | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [notifStatus, setNotifStatus] = useState<"idle" | "granted" | "denied" | "unsupported">("idle");
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const activationSentRef = useRef(false);

  useEffect(() => {
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      setLoadFailed(true);
      return;
    }
    timeoutRef.current = setTimeout(() => setLoadFailed(true), LOAD_TIMEOUT_MS);
    const db = createClient();
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
        const filtered = (data as Team[]).filter(
          (t) => (t.metadata?.["league"] as string | undefined) === "Allsvenskan",
        );
        setTeams(filtered.length > 0 ? filtered : (data as Team[]));
      });
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  const teamObj = teams.find((t) => (t.slug ?? t.id) === selectedTeam);

  const goTo = (next: number) => {
    setDir(next > step ? 1 : -1);
    setStep(next);
  };

  function trackProductEvent(event: string, props?: Record<string, string | number | boolean | null>) {
    void fetch("/api/analytics/event", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ event, props }),
      keepalive: true,
    }).catch(() => {});
  }

  function trackAttribution(
    event: "team_selected" | "activated",
    properties?: Record<string, string | number | boolean | null>,
  ) {
    void fetch("/api/utm/event", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ event, path: "/onboarding", properties }),
      keepalive: true,
    }).catch(() => {});
  }

  async function chooseTeam(slug: string, team: Team) {
    setSelectedTeam(slug);
    setSaving(true);
    try {
      await setFavoriteTeam(slug, team.id);
      trackProductEvent("onboarding_team_selected", { team_slug: slug });
      trackAttribution("team_selected", { team_slug: slug });
      setPreviewLoading(true);
      goTo(1);
      const res = await fetch(`/api/team/${encodeURIComponent(slug)}/hub`);
      if (res.ok) {
        const data = (await res.json()) as Preview;
        setPreview(data);
        const hasUsefulPreview =
          data.position != null ||
          data.nextMatch != null ||
          data.news.length > 0;
        if (hasUsefulPreview && !activationSentRef.current) {
          activationSentRef.current = true;
          trackProductEvent("first_useful_session", { team_slug: slug, surface: "onboarding_preview" });
          trackAttribution("activated", { team_slug: slug, surface: "onboarding_preview" });
        }
      }
    } finally {
      setSaving(false);
      setPreviewLoading(false);
    }
  }

  async function enableNotifications() {
    if (typeof window === "undefined" || !("Notification" in window)) {
      setNotifStatus("unsupported");
      return;
    }
    try {
      const perm = await Notification.requestPermission();
      setNotifStatus(perm === "granted" ? "granted" : "denied");
      if (perm === "granted") {
        // Subscribe via existing PWA flow if available
        try {
          await fetch("/api/push/subscribe", { method: "POST" }).catch(() => {});
        } catch {
          /* optional */
        }
      }
    } catch {
      setNotifStatus("denied");
    }
  }

  async function finish() {
    setSaving(true);
    try {
      if (!selectedTeam) markOnboardingDone();
      trackProductEvent("onboarding_complete", {
        team_slug: selectedTeam,
        notifications: notifStatus,
      });
      router.push("/mitt-lag");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-background">
      <div className="flex items-center gap-4 px-5 pt-[max(env(safe-area-inset-top),1.5rem)] pb-4 shrink-0">
        <Progress step={step} total={TOTAL_STEPS} />
        {step > 0 && (
          <button
            type="button"
            onClick={() => void finish()}
            disabled={saving}
            className="text-xs text-muted-foreground hover:text-foreground transition-colors touch-manipulation min-h-[44px] flex items-center shrink-0 disabled:opacity-50"
          >
            Hoppa över
          </button>
        )}
      </div>

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
              transition={{ duration: 0.28 }}
              className="absolute inset-0 flex flex-col px-5 pb-8 overflow-y-auto"
            >
              <h1 className="font-heading text-3xl text-foreground mt-2 mb-2">Välj ditt lag</h1>
              <p className="text-sm text-muted-foreground mb-6">
                Du får brief, matchdag och forum för just dem.
              </p>
              {loadFailed ? (
                <p className="text-sm text-destructive">Kunde inte ladda lagen. Försök igen.</p>
              ) : teams.length === 0 ? (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" /> Laddar Allsvenskan…
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-2">
                  {teams.map((t) => {
                    const slug = t.slug ?? t.id;
                    const active = selectedTeam === slug;
                    return (
                      <button
                        key={t.id}
                        type="button"
                        disabled={saving}
                        onClick={() => void chooseTeam(slug, t)}
                        className={`min-h-[52px] rounded-xl border px-3 py-3 text-left text-sm font-medium touch-manipulation transition-colors ${
                          active
                            ? "border-pitch bg-pitch/10 text-foreground"
                            : "border-border bg-card text-foreground hover:border-pitch/40"
                        }`}
                      >
                        {t.name}
                      </button>
                    );
                  })}
                </div>
              )}
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
              transition={{ duration: 0.28 }}
              className="absolute inset-0 flex flex-col px-5 pb-8 overflow-y-auto"
            >
              <h1 className="font-heading text-3xl text-foreground mt-2 mb-2">
                Så här ser {preview?.team.name ?? teamObj?.name ?? "ditt lag"} ut
              </h1>
              <p className="text-sm text-muted-foreground mb-6">
                Riktig data — ingen demo. Det här är din startsida.
              </p>

              {previewLoading && !preview ? (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" /> Hämtar laget…
                </div>
              ) : null}

              {preview ? (
                <div className="space-y-4">
                  {preview.position != null ? (
                    <div className="rounded-2xl border border-border bg-card px-4 py-3">
                      <p className="text-xs uppercase tracking-wide text-muted-foreground">Tabell</p>
                      <p className="text-2xl font-semibold tabular-nums mt-1">
                        {preview.position}
                        <span className="text-sm font-normal text-muted-foreground"> / 16</span>
                      </p>
                    </div>
                  ) : null}
                  {preview.nextMatch ? (
                    <div className="rounded-2xl border border-border bg-card px-4 py-3">
                      <p className="text-xs uppercase tracking-wide text-muted-foreground">Nästa match</p>
                      <p className="font-semibold mt-1">
                        {preview.nextMatch.home} – {preview.nextMatch.away}
                      </p>
                      <p className="text-sm text-muted-foreground tabular-nums mt-0.5">
                        {formatKickoff(preview.nextMatch.kickoffAt)}
                      </p>
                    </div>
                  ) : null}
                  <div className="rounded-2xl border border-border bg-card px-4 py-3">
                    <p className="text-xs uppercase tracking-wide text-muted-foreground mb-2">Nyheter</p>
                    {preview.news.length === 0 ? (
                      <p className="text-sm text-muted-foreground">Inga nyheter just nu.</p>
                    ) : (
                      <ul className="space-y-2">
                        {preview.news.slice(0, 3).map((n) => (
                          <li key={n.id} className="text-sm font-medium line-clamp-2">
                            {n.title}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </div>
              ) : !previewLoading ? (
                <p className="text-sm text-muted-foreground">
                  Preview laddas när laget är sparat. Fortsätt till notiser.
                </p>
              ) : null}

              <button
                type="button"
                onClick={() => goTo(2)}
                className="mt-auto w-full min-h-[54px] rounded-2xl pitch-gradient text-white font-semibold flex items-center justify-center gap-2 touch-manipulation"
              >
                Fortsätt <ArrowRight className="w-4 h-4" />
              </button>
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
              transition={{ duration: 0.28 }}
              className="absolute inset-0 flex flex-col px-5 pb-8"
            >
              <h1 className="font-heading text-3xl text-foreground mt-2 mb-2">Notiser</h1>
              <p className="text-sm text-muted-foreground mb-8">
                Valfritt. Få push när ditt lag har breaking news eller matchdag.
              </p>

              <div className="rounded-2xl border border-border bg-card px-5 py-5 flex items-start gap-3">
                <Bell className="h-5 w-5 text-pitch shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-semibold">Push-notiser</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Du kan alltid stänga av dem senare under Konto.
                  </p>
                  {notifStatus === "granted" ? (
                    <p className="mt-3 text-xs text-success inline-flex items-center gap-1">
                      <Check className="h-3.5 w-3.5" /> Aktiverade
                    </p>
                  ) : null}
                </div>
              </div>

              <div className="mt-auto space-y-2">
                {notifStatus !== "granted" ? (
                  <button
                    type="button"
                    onClick={() => void enableNotifications()}
                    className="w-full min-h-[54px] rounded-2xl border border-pitch/40 text-pitch font-semibold touch-manipulation"
                  >
                    Tillåt notiser
                  </button>
                ) : null}
                <button
                  type="button"
                  disabled={saving}
                  onClick={() => void finish()}
                  className="w-full min-h-[54px] rounded-2xl pitch-gradient text-white font-semibold flex items-center justify-center gap-2 touch-manipulation disabled:opacity-60"
                >
                  {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                  Öppna Mitt lag
                </button>
                <p className="text-center text-xs text-muted-foreground pt-1">
                  PRO kommer efteråt — när du sett värdet.{" "}
                  <button
                    type="button"
                    className="text-pitch hover:underline"
                    onClick={() => router.push("/prenumerera")}
                  >
                    Se priser
                  </button>
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
