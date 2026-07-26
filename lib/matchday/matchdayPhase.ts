import type { FixtureRow } from "@/lib/team-hub/queries";

export type MatchdayPhase = "pre" | "live" | "post" | "none";

/**
 * Pure phase function for "Min matchdag".
 *
 * Mapping is driven by `fixtures.status` (already normalized by athopia-os from
 * Sportmonks state_id — see FixtureRow in lib/team-hub/queries.ts, and the same
 * three-way status check reused across MatchdayBanner.tsx / FeedMatchHero.tsx):
 *   status === "LIVE"        → 'live'  (in-play, incl. HT — os collapses all live
 *                                        sub-states like state_id 2/3/22/... to "LIVE")
 *   status === "FT"          → 'post'  (state_id 5 per os convention, full time)
 *   status === "NS" and
 *     kickoff_at in the future (or unset) → 'pre'   (not started)
 *   no match at all          → 'none'
 *
 * `now` is injected so this stays pure/testable — no Date.now() inside.
 */
export function matchdayPhase(match: FixtureRow | null, now: Date): MatchdayPhase {
  if (!match) return "none";
  if (match.status === "LIVE") return "live";
  if (match.status === "FT") return "post";

  // NS (not started) or any other pre-kickoff status.
  if (match.kickoff_at) {
    const kickoff = new Date(match.kickoff_at);
    if (!Number.isNaN(kickoff.getTime()) && kickoff.getTime() <= now.getTime()) {
      // Kickoff time has passed but status hasn't flipped to LIVE/FT yet (sync lag)
      // — treat as live rather than showing a stale countdown.
      return "live";
    }
  }
  return "pre";
}
