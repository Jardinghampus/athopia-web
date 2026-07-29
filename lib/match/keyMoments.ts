/**
 * Slice 5.1 "AI-matchanalys" — billig v1. Deterministic "3 avgörande ögonblick"
 * derived purely from the already-synced fixture event stream. NO LLM, NO video,
 * NO GPU — the cheap first version from docs/strategy/founder-decisions-2026-07-27.md.
 * A grounded LLM narrative (and later computer vision) is a separate later slice.
 *
 * Behind MATCH_ANALYSIS_V1 flag, OFF by default. Elite-gated at the surface.
 *
 * Never fabricates: if the stream has no decisive events, returns [] and the UI
 * must hide the section (same discipline as "hide xG when missing").
 */
import type { MatchEvent } from "@/lib/match/events";

export function isMatchAnalysisEnabled(): boolean {
  return process.env.MATCH_ANALYSIS_V1 === "true";
}

export type KeyMoment = {
  minute: number | null;
  kind: "goal" | "red_card" | "penalty_missed";
  text: string;
};

/** Impact rank — goals decide matches more than cards; lower sorts first. */
const KIND_RANK: Record<KeyMoment["kind"], number> = {
  goal: 0,
  red_card: 1,
  penalty_missed: 2,
};

function classify(e: MatchEvent): KeyMoment["kind"] | null {
  if (e.rescinded || e.isCorrected) return null; // VAR-annulled never counts
  const t = e.eventType.toLowerCase();
  if (/missed/.test(t)) return "penalty_missed";
  if (/goal|penalty/.test(t)) return "goal";
  if (/redcard|red_card|yellow_red/.test(t)) return "red_card";
  return null;
}

function label(kind: KeyMoment["kind"], who: string): string {
  switch (kind) {
    case "goal":
      return `Mål — ${who}`;
    case "red_card":
      return `Rött kort — ${who}`;
    case "penalty_missed":
      return `Missad straff — ${who}`;
  }
}

/**
 * Picks up to `limit` decisive moments, ranked by impact then chronology.
 * Pure and deterministic — same events always yield the same list.
 */
export function buildKeyMoments(events: MatchEvent[], limit = 3): KeyMoment[] {
  const moments: KeyMoment[] = [];
  for (const e of events) {
    const kind = classify(e);
    if (!kind) continue;
    moments.push({
      minute: e.minute,
      kind,
      text: label(kind, e.playerName?.trim() || "okänd spelare"),
    });
  }
  moments.sort((a, b) => {
    if (KIND_RANK[a.kind] !== KIND_RANK[b.kind]) return KIND_RANK[a.kind] - KIND_RANK[b.kind];
    return (a.minute ?? 0) - (b.minute ?? 0);
  });
  return moments.slice(0, limit);
}
