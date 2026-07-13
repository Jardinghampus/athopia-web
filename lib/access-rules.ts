export type Plan = "free" | "pro" | "elite";

/**
 * Gating — "vi säljer bekvämlighet + FOMO att vara först".
 *
 * Gratis = FotMob-paritet (hänga med): flöde, push, live/tabell, forum läsa/skriva.
 * PRO = destillatet (låta smart utan att scrolla): AI-texter, matchanalys, forum-4h,
 *        transfer-radar, brief, poddklipp, chat, filter.
 * Elite = edge ovanpå PRO: clustering-UI, global AI-chat (när byggt).
 */
export const ACCESS = {
  basicFilter:        (_: Plan) => true,
  advancedFilter:     (p: Plan) => p !== "free",
  /** AI-artiklar / lag-sammanfattning / matchanalys-body */
  aiSummaries:        (p: Plan) => p !== "free",
  smartRanking:       (p: Plan) => p !== "free",
  crossSourceCluster: (p: Plan) => p === "elite",
  /**
   * Daglig brief — PRO (hemmaplan). Nyckelnamnet är legacy; beteendet är PRO+.
   * @deprecated Prefer aiSummaries / briefAudio for Daily.
   */
  eliteBrief:         (p: Plan) => p !== "free",
  pushAlerts:         (_: Plan) => true,
  unlimitedFeed:      (_: Plan) => true,
  aiChat:             (p: Plan) => p !== "free",
  podcastClips:       (p: Plan) => p !== "free",
  briefAudio:         (p: Plan) => p !== "free",
  /** Forum AI-sammanfattning senaste ~4h */
  forumSummary:       (p: Plan) => p !== "free",
  /** Ryktesradar / transfer-lista med status */
  transferSignals:    (p: Plan) => p !== "free",
} as const;

export type AccessFeature = keyof typeof ACCESS;

export function canAccess(feature: AccessFeature, plan: Plan): boolean {
  return ACCESS[feature](plan);
}
