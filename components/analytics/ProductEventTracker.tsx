"use client";

import { useEffect, useRef } from "react";

/** Fire-and-forget produkt-event (feed_open, match_page_view, …). */
export function ProductEventTracker({
  event,
  props,
}: {
  event: string;
  props?: Record<string, string | number | boolean | null>;
}) {
  const sent = useRef(false);

  useEffect(() => {
    if (sent.current) return;
    sent.current = true;
    void fetch("/api/analytics/event", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ event, props }),
    }).catch(() => {});
  }, [event, props]);

  return null;
}
