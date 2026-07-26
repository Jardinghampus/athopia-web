"use client";

import {
  FEED_EVENT_SCHEMA_VERSION,
  MAX_FEED_EVENTS_PER_REQUEST,
  type FeedEvent,
} from "@/lib/feed/feed-event-schema";

type FeedEventDraft = Omit<FeedEvent, "eventKey" | "occurredAt" | "schemaVersion">;

let consent: boolean | undefined;
let consentRequest: Promise<boolean> | undefined;
let pending: FeedEvent[] = [];
let flushTimer: ReturnType<typeof setTimeout> | undefined;
let flushing = false;
const MAX_PENDING_EVENTS = 100;

async function hasPersonalizationConsent(): Promise<boolean> {
  if (consent !== undefined) return consent;
  consentRequest ??= fetch("/api/feed/config", { cache: "no-store" })
    .then(async (response) => {
      if (!response.ok) return false;
      const config = (await response.json()) as { personalization_enabled?: unknown } | null;
      return config?.personalization_enabled === true;
    })
    .catch(() => false)
    .then((enabled) => {
      consent = enabled;
      return enabled;
    });
  return consentRequest;
}

function scheduleFlush(delayMs = 800) {
  if (flushTimer) return;
  flushTimer = setTimeout(() => {
    flushTimer = undefined;
    void flushFeedEvents();
  }, delayMs);
}

async function post(events: FeedEvent[], keepalive = false): Promise<boolean> {
  return fetch("/api/feed/events", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ events }),
    keepalive,
  })
    .then((response) => response.ok)
    .catch(() => false);
}

export async function flushFeedEvents() {
  if (pending.length === 0 || flushing) return;
  flushing = true;
  const batch = pending.slice(0, MAX_FEED_EVENTS_PER_REQUEST);
  const delivered = await post(batch, true);
  if (delivered) pending.splice(0, batch.length);
  flushing = false;
  if (pending.length > 0) scheduleFlush(delivered ? 800 : 15_000);
}

/** Keeps the in-memory gate in sync after the user saves the preference. */
export function setFeedPersonalizationConsent(enabled: boolean) {
  consent = enabled;
  consentRequest = Promise.resolve(enabled);
  if (!enabled) {
    pending = [];
    if (flushTimer) clearTimeout(flushTimer);
    flushTimer = undefined;
  }
}

/**
 * A deliberately narrow client collector for the consented Club Home contract.
 * It never accepts identity, titles, URLs, or other personal data.
 */
export async function queueFeedEvent(draft: FeedEventDraft) {
  if (!(await hasPersonalizationConsent())) return;

  pending.push({
    ...draft,
    eventKey: crypto.randomUUID(),
    occurredAt: new Date().toISOString(),
    schemaVersion: FEED_EVENT_SCHEMA_VERSION,
  });
  if (pending.length > MAX_PENDING_EVENTS) {
    pending.splice(0, pending.length - MAX_PENDING_EVENTS);
  }
  scheduleFlush();
}

if (typeof window !== "undefined") {
  window.addEventListener("pagehide", () => {
    if (pending.length === 0) return;
    const batch = pending.slice(0, MAX_FEED_EVENTS_PER_REQUEST);
    void post(batch, true);
  });
}
