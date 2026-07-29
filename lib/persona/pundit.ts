/**
 * Slice 5.2 "Din AI-pundit" — cheap v1. A deterministic, memory-flavoured intro
 * line for the Personal Daily, spoken in one knowledgeable Athopia voice that
 * references the user's team and what's happened "sedan sist".
 *
 * NO LLM: pure composition over the already-fetched PersonalDaily. This is the
 * billig-v1 from docs/strategy/founder-decisions-2026-07-27.md — a real LLM
 * voice is a later upgrade once retention (and Anthropic credits) allow it.
 *
 * Behind AI_PUNDIT flag, OFF by default so prod is unchanged.
 *
 * ponytail: one voice, no per-team persona registry — a per-club adjective map
 * would be speculative dressing. Add it only if users ask for distinct voices.
 */
import type { PersonalDaily } from "@/lib/daily/personal-daily";

export function isAiPunditEnabled(): boolean {
  return process.env.AI_PUNDIT === "true";
}

/** Total items across all sections. */
function countItems(daily: PersonalDaily): number {
  return daily.sections.reduce((n, s) => n + s.items.length, 0);
}

/** First item's title (the most important thing), or null when the day is quiet. */
function topTitle(daily: PersonalDaily): string | null {
  for (const s of daily.sections) {
    if (s.items.length > 0) return s.items[0].title;
  }
  return null;
}

/**
 * Deterministic pundit intro. `teamName` is optional — falls back to "ditt lag"
 * so no extra query is needed. Never fabricates: a quiet day says so plainly.
 */
export function buildPunditIntro(daily: PersonalDaily, teamName?: string | null): string {
  const team = teamName?.trim() || "ditt lag";
  const count = countItems(daily);
  const hasMatchToday = daily.sections.some((s) => s.key === "dagens-match");
  const top = topTitle(daily);

  if (hasMatchToday) {
    return top
      ? `Matchdag för ${team}. ${count} saker att ha koll på — störst just nu: ${top}.`
      : `Matchdag för ${team}. Jag håller koll och hör av mig när något händer.`;
  }
  if (count === 0 || !top) {
    return `Lugnt kring ${team} sedan sist. Jag säger till så fort något rör på sig.`;
  }
  const noun = count === 1 ? "sak" : "saker";
  return `Sedan sist om ${team}: ${count} ${noun} värda din tid. Det som sticker ut: ${top}.`;
}
