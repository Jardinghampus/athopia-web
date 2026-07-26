import { z } from "zod";

export const FEED_EVENT_SCHEMA_VERSION = "1" as const;
export const MAX_FEED_EVENTS_PER_REQUEST = 20;

const boundedId = z
  .string()
  .trim()
  .min(1)
  .max(160)
  .regex(/^[A-Za-z0-9:_-]+$/);

const factorSchema = z
  .object({
    key: z.string().trim().min(1).max(64).regex(/^[a-z0-9_:-]+$/),
    value: z.number().finite().min(-100).max(100),
  })
  .strict();

const metadataSchema = z
  .object({
    filterKey: z.enum(["sort", "content", "team"]).optional(),
    filterValue: z
      .enum(["for_you", "latest", "important", "all", "ai", "source"])
      .optional(),
    reason: z.enum(["user_action", "not_relevant", "seen", "other"]).optional(),
    variant: z.string().trim().min(1).max(64).regex(/^[A-Za-z0-9_-]+$/).optional(),
  })
  .strict();

export const FeedEventSchema = z
  .object({
    eventKey: z.string().uuid(),
    eventType: z.enum([
      "feed_open",
      "module_impression",
      "module_open",
      "item_open",
      "filter_change",
      "dismiss",
      "more_like_this",
      "less_like_this",
      "content_saved",
      "content_hidden",
    ]),
    surface: z.literal("club_home"),
    moduleKey: boundedId.optional(),
    itemId: boundedId.optional(),
    storyId: boundedId.optional(),
    position: z.number().int().min(0).max(10_000).optional(),
    score: z.number().finite().min(0).max(1).optional(),
    rankerVersion: z.string().trim().min(1).max(120).regex(/^[A-Za-z0-9._:-]+$/).optional(),
    factors: z.array(factorSchema).max(12).default([]),
    metadata: metadataSchema.default({}),
    occurredAt: z.string().datetime({ offset: true }),
    schemaVersion: z.literal(FEED_EVENT_SCHEMA_VERSION),
  })
  .strict();

export const FeedEventsRequestSchema = z
  .object({
    events: z.array(FeedEventSchema).min(1).max(MAX_FEED_EVENTS_PER_REQUEST),
  })
  .strict();

export type FeedEvent = z.infer<typeof FeedEventSchema>;

export function validateFeedEventTimes(
  events: FeedEvent[],
  nowMs = Date.now(),
): boolean {
  const oldestAllowed = nowMs - 7 * 24 * 60 * 60 * 1_000;
  const newestAllowed = nowMs + 5 * 60 * 1_000;
  return events.every((event) => {
    const occurredAt = Date.parse(event.occurredAt);
    return occurredAt >= oldestAllowed && occurredAt <= newestAllowed;
  });
}
