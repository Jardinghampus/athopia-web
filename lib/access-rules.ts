export type Plan = "free" | "pro" | "elite";

/**
 * Kanoniskt accesskontrakt — minsta plan per feature.
 *
 * Gratis = FotMob-paritet (hänga med): flöde, push, live/tabell, forum läsa/skriva.
 * PRO = destillatet (låta smart utan att scrolla): AI-texter, matchanalys, forum-4h,
 *        transfer-radar, brief, poddklipp, match-chat, global AI-chat, filter.
 * Elite = edge ovanpå PRO: clustering-UI.
 *
 * Denna deklarativa map exporteras till iOS via `pnpm contracts:generate`.
 */
export const ACCESS = {
  basicFilter:        "free",
  advancedFilter:     "pro",
  /** AI-artiklar / lag-sammanfattning / matchanalys-body */
  aiSummaries:        "pro",
  smartRanking:       "pro",
  crossSourceCluster: "elite",
  /**
   * Daglig brief — PRO (hemmaplan). Nyckelnamnet är legacy; beteendet är PRO+.
   * @deprecated Prefer aiSummaries / briefAudio for Daily.
   */
  eliteBrief:         "pro",
  pushAlerts:         "free",
  unlimitedFeed:      "free",
  /** Matchkontext-chatten. */
  aiChat:             "pro",
  /** Global Athopia AI med verktyg över hela Allsvenskan. Founderbeslut D2 2026-07-14: PRO. */
  globalAiChat:       "pro",
  podcastClips:       "pro",
  briefAudio:         "pro",
  /** Forum AI-sammanfattning senaste ~4h */
  forumSummary:       "pro",
  /** Ryktesradar / transfer-lista med status */
  transferSignals:    "pro",
} as const satisfies Record<string, Plan>;

export type AccessFeature = keyof typeof ACCESS;

const PLAN_RANK: Record<Plan, number> = {
  free: 0,
  pro: 1,
  elite: 2,
};

export function canAccess(feature: AccessFeature, plan: Plan): boolean {
  return PLAN_RANK[plan] >= PLAN_RANK[ACCESS[feature]];
}

export function requiredPlanFor(feature: AccessFeature): Plan {
  return ACCESS[feature];
}
