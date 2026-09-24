import type { clerkClient } from "@clerk/nextjs/server";
import type { Plan } from "./access-rules";

type Clerk = Awaited<ReturnType<typeof clerkClient>>;

/**
 * Skriver bara hockey-facket. Fotbollens `publicMetadata.plan` och
 * `stripeSubscriptionId` rörs inte.
 */
export async function writeHockeyPlan(
  clerk: Clerk,
  userId: string,
  plan: Plan,
  extra?: { customerId?: string | null; subscriptionId?: string | null },
): Promise<void> {
  const user = await clerk.users.getUser(userId);
  const current = user.publicMetadata?.plans;
  const plans =
    current && typeof current === "object" ? { ...(current as Record<string, unknown>) } : {};
  plans.hockey = plan;

  await clerk.users.updateUserMetadata(userId, {
    publicMetadata: { plans },
    privateMetadata: {
      stripePlanHockey: plan,
      ...(extra?.customerId ? { stripeHockeyCustomerId: extra.customerId } : {}),
      ...(extra && "subscriptionId" in extra
        ? { stripeHockeySubscriptionId: extra.subscriptionId ?? null }
        : {}),
    },
  });
}
