import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { FeedEventsResponseSchema } from "@/lib/api-schemas";
import {
  FeedEventsRequestSchema,
  validateFeedEventTimes,
} from "@/lib/feed/feed-event-schema";

const validEvent = {
  eventKey: "f83cffcb-1b21-4a61-bf74-0ba68898c7b2",
  eventType: "item_open",
  surface: "club_home",
  moduleKey: "top_stories",
  itemId: "article:123",
  position: 2,
  score: 0.83,
  rankerVersion: "deterministic-v1",
  factors: [{ key: "recency", value: 0.7 }],
  metadata: {},
  occurredAt: "2026-07-26T08:00:00.000Z",
  schemaVersion: "1",
} as const;

describe("FeedEventsRequestSchema", () => {
  it("accepts a strict, bounded event", () => {
    assert.equal(
      FeedEventsRequestSchema.safeParse({ events: [validEvent] }).success,
      true,
    );
  });

  it("rejects oversized batches and untrusted fields", () => {
    assert.equal(
      FeedEventsRequestSchema.safeParse({
        events: Array.from({ length: 21 }, (_, index) => ({
          ...validEvent,
          eventKey: `f83cffcb-1b21-4a61-bf74-${String(index).padStart(12, "0")}`,
        })),
      }).success,
      false,
    );
    assert.equal(
      FeedEventsRequestSchema.safeParse({
        events: [{ ...validEvent, clerkUserId: "attacker-controlled" }],
      }).success,
      false,
    );
  });

  it("rejects invalid event semantics", () => {
    assert.equal(
      FeedEventsRequestSchema.safeParse({
        events: [{ ...validEvent, surface: "admin" }],
      }).success,
      false,
    );
    assert.equal(
      FeedEventsRequestSchema.safeParse({
        events: [{ ...validEvent, score: 2 }],
      }).success,
      false,
    );
  });
});

describe("feedback event types (Slice 2)", () => {
  it("accepts the 4 new feedback eventTypes", () => {
    for (const eventType of [
      "more_like_this",
      "less_like_this",
      "content_saved",
      "content_hidden",
    ] as const) {
      assert.equal(
        FeedEventsRequestSchema.safeParse({
          events: [{ ...validEvent, eventType }],
        }).success,
        true,
        `expected ${eventType} to be accepted`,
      );
    }
  });

  it("still rejects an unknown eventType", () => {
    assert.equal(
      FeedEventsRequestSchema.safeParse({
        events: [{ ...validEvent, eventType: "not_a_real_event" }],
      }).success,
      false,
    );
  });
});

describe("feed event time bounds", () => {
  it("rejects stale and future events", () => {
    const now = Date.parse("2026-07-26T08:01:00.000Z");
    const parsed = FeedEventsRequestSchema.parse({ events: [validEvent] });
    assert.equal(validateFeedEventTimes(parsed.events, now), true);
    assert.equal(
      validateFeedEventTimes(
        [{ ...parsed.events[0], occurredAt: "2026-07-27T08:00:00.000Z" }],
        now,
      ),
      false,
    );
  });
});

describe("FeedEventsResponseSchema", () => {
  it("exposes only explicit privacy gate reasons", () => {
    assert.equal(
      FeedEventsResponseSchema.safeParse({
        ok: true,
        accepted: 0,
        duplicates: 0,
        skipped: "personalization_disabled",
      }).success,
      true,
    );
    assert.equal(
      FeedEventsResponseSchema.safeParse({
        ok: true,
        accepted: 0,
        duplicates: 0,
        skipped: "consent_required",
      }).success,
      false,
    );
  });
});
