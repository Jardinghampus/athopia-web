import { currentUser } from "@clerk/nextjs/server";

export type Plan = "free" | "pro" | "elite";

export async function getUserPlan(): Promise<Plan> {
  const user = await currentUser();
  if (!user) return "free";
  return (user.publicMetadata?.plan as Plan) ?? "free";
}

export const ACCESS = {
  basicFilter:        (_: Plan) => true,
  advancedFilter:     (p: Plan) => p !== "free",
  aiSummaries:        (p: Plan) => p !== "free",
  smartRanking:       (p: Plan) => p !== "free",
  crossSourceCluster: (p: Plan) => p === "elite",
  eliteBrief:         (p: Plan) => p === "elite",
  pushAlerts:         (p: Plan) => p !== "free",
  unlimitedFeed:      (p: Plan) => p !== "free",
} as const;

export type AccessFeature = keyof typeof ACCESS;

export function canAccess(feature: AccessFeature, plan: Plan): boolean {
  return ACCESS[feature](plan);
}
