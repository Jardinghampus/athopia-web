"use client";

import { useEffect, useRef } from "react";

/**
 * Fire-and-forget produkt-event (feed_open, match_page_view, …).
 * `once`: dedup-nyckel — eventet skickas max en gång per besökare (localStorage)
 * eller per session (`onceScope="session"`). Utan `once`: en gång per mount.
 */
export function ProductEventTracker({
  event,
  props,
  once,
  onceScope = "local",
}: {
  event: string;
  props?: Record<string, string | number | boolean | null>;
  once?: string;
  onceScope?: "local" | "session";
}) {
  const sent = useRef(false);

  useEffect(() => {
    if (sent.current) return;
    sent.current = true;
    if (once) {
      try {
        const storage = onceScope === "session" ? window.sessionStorage : window.localStorage;
        const key = `athopia_evt_once::${once}`;
        if (storage.getItem(key)) return;
        storage.setItem(key, "1");
      } catch {
        // Storage blockerad (t.ex. privat läge) → skicka ändå
      }
    }
    void fetch("/api/analytics/event", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ event, props }),
    }).catch(() => {});
  }, [event, props, once, onceScope]);

  return null;
}
