import type { Plan } from "@/lib/access-rules";

export type PlanSource = "stripe" | "storekit";

const PLAN_RANK: Record<Plan, number> = {
  free: 0,
  pro: 1,
  elite: 2,
};

export function normalizePlan(value: unknown): Plan {
  return value === "elite" ? "elite" : value === "pro" ? "pro" : "free";
}

export function readEffectivePlanSources(input: {
  publicPlan: unknown;
  stripePlan: unknown;
  storekitPlan: unknown;
}): {
  stripePlan: Plan;
  storekitPlan: Plan;
  effectivePlan: Plan;
} {
  const hasStripeMetadata = typeof input.stripePlan === "string";
  const hasStorekitMetadata = typeof input.storekitPlan === "string";

  const stripePlan = hasStripeMetadata
    ? normalizePlan(input.stripePlan)
    : hasStorekitMetadata
      ? normalizePlan(input.publicPlan)
      : normalizePlan(input.publicPlan);

  const storekitPlan = hasStorekitMetadata
    ? normalizePlan(input.storekitPlan)
    : "free";

  const effectivePlan = [stripePlan, storekitPlan].reduce<Plan>(
    (highest, candidate) =>
      PLAN_RANK[candidate] > PLAN_RANK[highest] ? candidate : highest,
    "free",
  );

  return { stripePlan, storekitPlan, effectivePlan };
}

export function resolvePlanSources(input: {
  publicPlan: unknown;
  stripePlan: unknown;
  storekitPlan: unknown;
  source: PlanSource;
  sourcePlan: Plan;
}): {
  stripePlan: Plan;
  storekitPlan: Plan;
  effectivePlan: Plan;
} {
  const hasStripeMetadata = typeof input.stripePlan === "string";
  const legacyStripePlan =
    !hasStripeMetadata && input.source === "storekit"
      ? normalizePlan(input.publicPlan)
      : "free";
  const stripePlan =
    input.source === "stripe"
      ? input.sourcePlan
      : hasStripeMetadata
        ? normalizePlan(input.stripePlan)
        : legacyStripePlan;
  const storekitPlan =
    input.source === "storekit"
      ? input.sourcePlan
      : normalizePlan(input.storekitPlan);
  const effectivePlan = [stripePlan, storekitPlan].reduce<Plan>(
    (highest, candidate) =>
      PLAN_RANK[candidate] > PLAN_RANK[highest] ? candidate : highest,
    "free",
  );

  return { stripePlan, storekitPlan, effectivePlan };
}
