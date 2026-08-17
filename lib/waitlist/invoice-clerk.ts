/**
 * Stripe Invoice på API 2026-04-22 flyttade subscription till
 * parent.subscription_details. Äldre payloads har fortfarande
 * invoice.subscription. Vi läser båda.
 */

type SubscriptionLike = {
  id?: string;
  metadata?: Record<string, string | undefined>;
};

function asSubscription(raw: unknown): SubscriptionLike | string | null {
  if (typeof raw === "string" && raw.length > 0) return raw;
  if (raw && typeof raw === "object") return raw as SubscriptionLike;
  return null;
}

export function subscriptionFromInvoice(invoice: {
  subscription?: unknown;
  parent?: { subscription_details?: { subscription?: unknown } | null } | null;
}): SubscriptionLike | string | null {
  return asSubscription(invoice.subscription) ?? asSubscription(invoice.parent?.subscription_details?.subscription);
}

export function clerkUserIdFromSubscription(sub: SubscriptionLike | string | null): string | undefined {
  if (!sub || typeof sub === "string") return undefined;
  const id = sub.metadata?.clerkUserId;
  return typeof id === "string" && id.length > 0 ? id : undefined;
}

export function subscriptionIdFrom(sub: SubscriptionLike | string | null): string | undefined {
  if (typeof sub === "string") return sub;
  if (sub && typeof sub.id === "string" && sub.id.length > 0) return sub.id;
  return undefined;
}
