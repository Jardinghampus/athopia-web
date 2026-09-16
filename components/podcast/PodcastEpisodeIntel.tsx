"use client";

import { useEffect, useMemo, useState } from "react";
import { UpgradePrompt } from "@/components/UpgradePrompt";
import { PodcastAskSheet, PodcastAskTrigger } from "./PodcastAskSheet";
import type { AthopiaPodcastSummary } from "@/lib/podcast/summary";

type SummaryPayload = {
  headline: string | null;
  bullets: string[];
  teaser: string | null;
  unlocked: boolean;
  hasSource: boolean;
};

export function PodcastEpisodeIntel({
  episodeId,
  episodeTitle,
  mentionedTeams,
  hasSource,
}: {
  episodeId: string;
  episodeTitle: string;
  mentionedTeams: string[];
  hasSource: boolean;
}) {
  const [summary, setSummary] = useState<AthopiaPodcastSummary | null>(null);
  const [teaser, setTeaser] = useState<string | null>(null);
  const [unlocked, setUnlocked] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);
  const [chatOpen, setChatOpen] = useState(false);

  useEffect(() => {
    let cancelled = false;
    // Strict Mode monterar effekten två gånger — avbryt första körningens anrop
    // så att bara en generering (och en tokenpost) når servern.
    const ac = new AbortController();
    const { signal } = ac;

    async function load() {
      try {
        const getRes = await fetch(
          `/api/elite/podcast-summary?episodeId=${encodeURIComponent(episodeId)}`,
          { signal },
        );
        if (!getRes.ok) throw new Error("summary get failed");
        const data = (await getRes.json()) as SummaryPayload;
        if (cancelled) return;
        setUnlocked(data.unlocked);
        setTeaser(data.teaser);
        if (data.headline && data.bullets.length >= 3) {
          setSummary({
            headline: data.headline,
            bullets: data.bullets,
            generatedAt: new Date().toISOString(),
          });
          setLoading(false);
          return;
        }
        if (data.unlocked && data.hasSource) {
          const postRes = await fetch("/api/elite/podcast-summary", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ episodeId }),
            signal,
          });
          if (cancelled) return;
          if (postRes.ok) {
            const generated = (await postRes.json()) as SummaryPayload;
            if (generated.headline && generated.bullets.length >= 3) {
              setSummary({
                headline: generated.headline,
                bullets: generated.bullets,
                generatedAt: new Date().toISOString(),
              });
            }
          }
        }
      } catch {
        if (!cancelled) setUnlocked(false);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void load();
    return () => {
      cancelled = true;
      ac.abort();
    };
  }, [episodeId]);

  const suggestions = useMemo(() => {
    const teamQs = mentionedTeams.slice(0, 2).map((team) => ({
      label: `Vad sa de om ${team}?`,
      q: `Vad sa de om ${team} i det här avsnittet?`,
    }));
    return [
      { label: "Vad handlade det om?", q: "Sammanfatta avsnittet kort." },
      ...teamQs,
      { label: "Nämndes transfers?", q: "Nämndes några transfers, värvningar eller sälj?" },
    ].slice(0, 4);
  }, [mentionedTeams]);

  return (
    <section className="mb-8 rounded-xl border border-border bg-card p-4 sm:p-5">
      <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
        Sammanfattning
      </h2>

      {loading || unlocked === null ? (
        <div className="mt-3 space-y-2" aria-busy="true" aria-label="Laddar sammanfattning">
          <div className="h-4 w-3/4 animate-pulse rounded bg-muted" />
          <div className="h-4 w-full animate-pulse rounded bg-muted" />
          <div className="h-4 w-5/6 animate-pulse rounded bg-muted" />
        </div>
      ) : !unlocked ? (
        <div className="mt-3 space-y-3">
          {teaser && <p className="text-sm text-muted-foreground italic">{teaser}</p>}
          <UpgradePrompt feature="podcastAiChat" teamName={mentionedTeams[0]} />
        </div>
      ) : !hasSource ? (
        <p className="mt-3 text-sm text-muted-foreground">
          Avsnittet är inte transkriberat ännu, så det finns ingen sammanfattning att läsa.
        </p>
      ) : summary ? (
        <div className="mt-3">
          <p className="text-sm font-medium text-foreground text-balance">{summary.headline}</p>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-foreground/85">
            {summary.bullets.map((b) => (
              <li key={b}>{b}</li>
            ))}
          </ul>
        </div>
      ) : (
        <p className="mt-3 text-sm text-muted-foreground">
          Sammanfattningen kunde inte skapas just nu. Du kan fortfarande fråga om avsnittet.
        </p>
      )}

      {unlocked && hasSource && (
        <div className="mt-4">
          <PodcastAskTrigger onClick={() => setChatOpen(true)} />
          <PodcastAskSheet
            open={chatOpen}
            onOpenChange={setChatOpen}
            episodeId={episodeId}
            episodeTitle={episodeTitle}
            suggestions={suggestions}
          />
        </div>
      )}
    </section>
  );
}
