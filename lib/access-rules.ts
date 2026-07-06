export type Plan = "free" | "pro" | "elite";

export const ACCESS = {
  basicFilter:        (_: Plan) => true,
  advancedFilter:     (p: Plan) => p !== "free",
  aiSummaries:        (p: Plan) => p !== "free",
  smartRanking:       (p: Plan) => p !== "free",
  crossSourceCluster: (p: Plan) => p === "elite",
  eliteBrief:         (p: Plan) => p === "elite",
  pushAlerts:         (p: Plan) => p !== "free",
  unlimitedFeed:      (p: Plan) => p !== "free",
  /** AI-chat på matchsida, lag-hub m.m. */
  aiChat:             (p: Plan) => p !== "free",
  /** Podklipp med transkript på match/lag */
  podcastClips:       (p: Plan) => p !== "free",
  /** TTS för dagens brief */
  briefAudio:         (p: Plan) => p !== "free",
} as const;

export type AccessFeature = keyof typeof ACCESS;

export function canAccess(feature: AccessFeature, plan: Plan): boolean {
  return ACCESS[feature](plan);
}
