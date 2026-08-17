import { z } from "zod";

export const NEWSLETTER_POLICY_VERSION = "lagbrief-v1";
export const NEWSLETTER_SPORT = "football" as const;

export const CadenceSchema = z.enum(["quiet", "standard", "max"]);
export type NewsletterCadence = z.infer<typeof CadenceSchema>;

const TeamSlugSchema = z
  .string()
  .trim()
  .min(1, "Välj ett lag.")
  .max(100)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Ogiltigt lag.");

export const NewsletterSignupSchema = z
  .object({
    email: z.string().trim().email("Ogiltig e-postadress.").max(254).optional(),
    teamSlug: TeamSlugSchema,
    cadence: CadenceSchema,
    consent: z.literal(true, {
      errorMap: () => ({ message: "Du måste godkänna villkoren." }),
    }),
    honeypot: z.string().max(200).optional().default(""),
  })
  .strict();

export const NewsletterPreferencesPatchSchema = z
  .object({
    teamSlug: TeamSlugSchema.optional(),
    cadence: CadenceSchema.optional(),
    enabled: z.boolean().optional(),
    followProfileTeam: z.boolean().optional(),
  })
  .strict()
  .refine((value) => Object.keys(value).length > 0, "Ingen ändring angavs.");

export type NewsletterPreferencesPatch = z.infer<
  typeof NewsletterPreferencesPatchSchema
>;

export function normalizeNewsletterPlan(value: unknown): "free" | "pro" | "elite" {
  const plan = typeof value === "string" ? value.trim().toLowerCase() : "";
  if (plan === "elite") return "elite";
  if (
    plan === "pro" ||
    plan === "founder" ||
    plan === "founder-pro" ||
    plan === "founder_pro"
  ) {
    return "pro";
  }
  return "free";
}

export interface ClerkIdentityInput {
  id: string;
  primaryEmailAddressId?: string | null;
  emailAddresses?: Array<{ id?: string; emailAddress?: string }>;
  publicMetadata?: Record<string, unknown>;
}

export function newsletterIdentityFromClerk(user: ClerkIdentityInput): {
  clerkUserId: string;
  email: string;
  plan: "free" | "pro" | "elite";
} | null {
  const primary =
    user.emailAddresses?.find(
      (address) => address.id === user.primaryEmailAddressId,
    ) ?? user.emailAddresses?.[0];
  const email = primary?.emailAddress?.trim().toLowerCase();
  if (!email) return null;
  return {
    clerkUserId: user.id,
    email,
    plan: normalizeNewsletterPlan(user.publicMetadata?.plan),
  };
}

export type NewsletterLifecycleStatus =
  | "active"
  | "paused"
  | "unsubscribed"
  | "bounced"
  | "complained";

export interface BeehiivEventAction {
  kind: "subscriber" | "post" | "ignore";
  status?: NewsletterLifecycleStatus;
  deleteLocal?: boolean;
  postState?: "scheduled" | "sent";
}

export function mapBeehiivEvent(
  eventType: string,
  lifecycleStatus?: unknown,
): BeehiivEventAction {
  const type = eventType.trim().toLowerCase().replaceAll("_", ".");
  const status =
    typeof lifecycleStatus === "string"
      ? lifecycleStatus.trim().toLowerCase().replaceAll("_", ".")
      : "";
  if (type.includes("post") && status === "scheduled") {
    return { kind: "post", postState: "scheduled" };
  }
  if (type.includes("post") && (status === "sent" || status === "published")) {
    return { kind: "post", postState: "sent" };
  }
  if (status && type.includes("subscription")) {
    const mappedStatus = mapBeehiivEvent(`subscription.${status}`);
    if (mappedStatus.kind !== "ignore") return mappedStatus;
  }
  if (
    /(^|\.)(confirmed|active|activated|resumed)$/.test(type)
  ) {
    return { kind: "subscriber", status: "active" };
  }
  if (/(^|\.)(paused)$/.test(type)) {
    return { kind: "subscriber", status: "paused" };
  }
  if (/(^|\.)(deleted)$/.test(type)) {
    return { kind: "subscriber", status: "unsubscribed", deleteLocal: true };
  }
  if (/(^|\.)(unsubscribed)$/.test(type)) {
    return { kind: "subscriber", status: "unsubscribed" };
  }
  if (/(^|\.)(bounced|bounce)$/.test(type)) {
    return { kind: "subscriber", status: "bounced" };
  }
  if (/(^|\.)(complained|complaint)$/.test(type)) {
    return { kind: "subscriber", status: "complained" };
  }
  if (/(^|\.)post\.scheduled$/.test(type) || type === "post.scheduled") {
    return { kind: "post", postState: "scheduled" };
  }
  if (/(^|\.)post\.(sent|published)$/.test(type) || type === "post.sent") {
    return { kind: "post", postState: "sent" };
  }
  return { kind: "ignore" };
}

export function isUniqueViolation(error: { code?: string } | null | undefined): boolean {
  return error?.code === "23505";
}

export function redactWebhookPayload(
  eventType: string,
  data: Record<string, unknown>,
): Record<string, unknown> {
  return {
    eventType,
    subscriptionId: firstString(
      data.subscription_id,
      data.subscriptionId,
      nestedString(data.subscription, "id"),
      data.id,
    ),
    postId: firstString(
      data.post_id,
      data.postId,
      nestedString(data.post, "id"),
    ),
    occurredAt: firstString(data.occurred_at, data.created_at, data.timestamp),
  };
}

export function webhookObjectIds(data: Record<string, unknown>): {
  subscriptionId: string | null;
  postId: string | null;
} {
  const redacted = redactWebhookPayload("", data);
  return {
    subscriptionId:
      typeof redacted.subscriptionId === "string"
        ? redacted.subscriptionId
        : null,
    postId: typeof redacted.postId === "string" ? redacted.postId : null,
  };
}

function nestedString(value: unknown, key: string): unknown {
  return value && typeof value === "object"
    ? (value as Record<string, unknown>)[key]
    : undefined;
}

function firstString(...values: unknown[]): string | null {
  for (const value of values) {
    if (typeof value === "string" && value.trim()) return value.trim();
  }
  return null;
}
