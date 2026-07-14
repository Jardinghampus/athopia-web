import "server-only";

import { clerkClient } from "@clerk/nextjs/server";
import type { Plan } from "@/lib/access-rules";
import { withUserPlanLock } from "@/lib/plan-lock";
import {
  normalizePlan,
  readEffectivePlanSources,
  type PlanSource,
} from "@/lib/plan-sources";

export async function reconcileEffectivePlan(userId: string): Promise<Plan> {
  const client = await clerkClient();
  const user = await client.users.getUser(userId);
  const privateMetadata = user.privateMetadata as Record<string, unknown>;
  const publicMetadata = user.publicMetadata as Record<string, unknown>;

  const { effectivePlan } = readEffectivePlanSources({
    publicPlan: publicMetadata.plan,
    stripePlan: privateMetadata.stripePlan,
    storekitPlan: privateMetadata.storekitPlan,
  });

  const currentPublic = normalizePlan(publicMetadata.plan);
  if (effectivePlan !== currentPublic) {
    await client.users.updateUserMetadata(userId, {
      publicMetadata: { plan: effectivePlan },
    });
  }

  return effectivePlan;
}

export async function updatePlanSource(
  userId: string,
  source: PlanSource,
  sourcePlan: Plan,
): Promise<Plan> {
  return withUserPlanLock(userId, async () => {
    const client = await clerkClient();

    // Patch only the changed source — Clerk shallow-merges metadata keys so the
    // other payment source is not clobbered by concurrent webhooks.
    await client.users.updateUserMetadata(userId, {
      privateMetadata:
        source === "stripe"
          ? { stripePlan: sourcePlan }
          : { storekitPlan: sourcePlan },
    });

    return reconcileEffectivePlan(userId);
  });
}
