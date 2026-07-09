"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Headphones, Pause, Play } from "lucide-react";
import { cn } from "@/lib/utils";
import { canAccess, type Plan } from "@/lib/access-rules";
import type { DailyEpisode } from "@/lib/team-hub/queries";
import { TrackedLink } from "@/components/analytics/TrackedLink";

const DAILY_UPGRADE_URL = "/prenumerera?utm_source=daily&utm_medium=player&utm_campaign=daily_pro";

function trackEvent(event: string, props?: Record<string, string | number | boolean | null>) {
  void fetch("/api/analytics/event", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ event, props }),
  }).catch(() => {});
}

function formatTime(sec: number) {
  if (!Number.isFinite(sec) || sec < 0) return "0:00";
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

function dateLabel(value: string) {
  if (!value) return "Idag";
  return new Date(`${value}T12:00:00`).toLocaleDateString("sv-SE", {
    day: "numeric",
    month: "short",
  });
}

interface DailyPodcastPlayerProps {
  episode: DailyEpisode;
  plan: Plan;
  className?: string;
}

export function DailyPodcastPlayer({ episode, plan, className }: DailyPodcastPlayerProps) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [playing, setPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(episode.duration_sec ?? 0);
  const hasAccess = canAccess("briefAudio", plan);

  const stop = useCallback(() => {
    const audio = audioRef.current;
    if (audio) {
      audio.pause();
      audio.currentTime = 0;
    }
    setPlaying(false);
    setCurrentTime(0);
  }, []);

  useEffect(() => () => stop(), [stop]);

  const togglePlay = () => {
    if (!hasAccess) return;
    const audio = audioRef.current;
    if (!audio) return;

    if (playing) {
      audio.pause();
      setPlaying(false);
      return;
    }

    void audio.play().then(() => setPlaying(true)).catch(() => setPlaying(false));
  };

  const seek = (nextTime: number) => {
    if (!hasAccess) return;
    const audio = audioRef.current;
    if (!audio || !duration) return;
    const clamped = Math.max(0, Math.min(duration, nextTime));
    audio.currentTime = clamped;
    setCurrentTime(clamped);
  };

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <section
      className={cn(
        "rounded-xl border border-pitch/30 bg-gradient-to-br from-pitch/10 via-card to-card overflow-hidden",
        className
      )}
      aria-label="Athopia Daily podcast"
    >
      <div className="px-4 sm:px-5 py-4 sm:py-5">
        <div className="mb-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            <Headphones className="h-3.5 w-3.5 text-pitch" aria-hidden />
            Athopia Daily
            {episode.episode_type === "club_daily" && (
              <span className="rounded-full bg-pitch/15 px-2 py-0.5 text-[10px] text-pitch">Ditt lag</span>
            )}
          </div>
          <span className="text-xs text-muted-foreground">{dateLabel(episode.episode_date)}</span>
        </div>

        <h2 className="text-lg sm:text-xl font-bold leading-snug text-foreground">{episode.title}</h2>
        <p className="mt-1 text-xs text-muted-foreground">
          {episode.duration_sec ? `${Math.round(episode.duration_sec / 60)} min` : "~7 min"} · Allsvenskan idag
        </p>

        {!hasAccess ? (
          <div className="mt-4 flex items-center gap-3">
            <button
              type="button"
              onClick={() => trackEvent("daily_play_blocked_pro", { slug: episode.slug })}
              aria-label="Spela avsnitt (kräver PRO)"
              className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground transition-colors hover:bg-muted/80"
            >
              <Play className="h-5 w-5 ml-0.5" />
            </button>
            <p className="text-sm text-muted-foreground">
              Lyssna på Athopia Daily kräver PRO.{" "}
              <TrackedLink
                href={DAILY_UPGRADE_URL}
                event="daily_checkout_click"
                props={{ placement: "daily_player", slug: episode.slug }}
                className="font-medium text-pitch hover:underline"
              >
                Uppgradera
              </TrackedLink>
            </p>
          </div>
        ) : (
          <>
            <audio
              ref={audioRef}
              src={`/api/daily/audio?slug=${encodeURIComponent(episode.slug)}`}
              preload="metadata"
              onLoadedMetadata={(e) => {
                const d = e.currentTarget.duration;
                if (Number.isFinite(d) && d > 0) setDuration(d);
              }}
              onTimeUpdate={(e) => setCurrentTime(e.currentTarget.currentTime)}
              onEnded={() => {
                setPlaying(false);
                setCurrentTime(0);
              }}
              onPause={() => setPlaying(false)}
              onPlay={() => setPlaying(true)}
              className="sr-only"
            />

            <div className="mt-4 flex items-center gap-3">
              <button
                type="button"
                onClick={togglePlay}
                aria-label={playing ? "Pausa avsnitt" : "Spela avsnitt"}
                className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-pitch text-white shadow-md shadow-pitch/25 transition-transform hover:scale-[1.03] active:scale-95"
              >
                {playing ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5 ml-0.5" />}
              </button>

              <div className="min-w-0 flex-1">
                <button
                  type="button"
                  aria-label="Spola i avsnittet"
                  onClick={(e) => {
                    const rect = e.currentTarget.getBoundingClientRect();
                    const ratio = (e.clientX - rect.left) / rect.width;
                    seek(ratio * duration);
                  }}
                  className="group relative h-2 w-full overflow-hidden rounded-full bg-muted"
                >
                  <span
                    className="absolute inset-y-0 left-0 rounded-full bg-pitch transition-[width] duration-150"
                    style={{ width: `${progress}%` }}
                  />
                </button>
                <div className="mt-1.5 flex justify-between text-[11px] tabular-nums text-muted-foreground">
                  <span>{formatTime(currentTime)}</span>
                  <span>{formatTime(duration)}</span>
                </div>
              </div>
            </div>

            {episode.chapter_markers.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-2">
                {episode.chapter_markers.map((chapter) => (
                  <button
                    key={`${chapter.start_sec}-${chapter.label}`}
                    type="button"
                    onClick={() => {
                      seek(chapter.start_sec);
                      if (!playing && audioRef.current) {
                        void audioRef.current.play().then(() => setPlaying(true));
                      }
                    }}
                    className="rounded-full border border-border bg-background/60 px-2.5 py-1 text-[11px] text-muted-foreground transition-colors hover:border-pitch/40 hover:text-foreground"
                  >
                    {chapter.label}
                  </button>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </section>
  );
}
