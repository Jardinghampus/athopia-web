"use client";

import { useEffect, useRef } from "react";
import { usePathname, useSearchParams } from "next/navigation";

/**
 * Fires once per session when an authenticated supporter lands on a
 * "first useful session" surface (/daily or /mitt-lag) with a prior UTM cookie.
 */
export function UtmActivationTracker({ enabled }: { enabled: boolean }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const sent = useRef(false);

  useEffect(() => {
    if (!enabled || sent.current) return;
    if (typeof window === "undefined") return;

    const guardKey = "athopia_utm_activated_sent";
    if (window.sessionStorage.getItem(guardKey) === "1") {
      sent.current = true;
      return;
    }

    sent.current = true;
    window.sessionStorage.setItem(guardKey, "1");

    const sid = searchParams.get("sid");
    void fetch("/api/utm/milestone", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        event: "activated",
        path: pathname,
        ...(sid ? { sourceTeaserId: sid } : {}),
      }),
      keepalive: true,
    }).catch(() => {});
  }, [enabled, pathname, searchParams]);

  return null;
}
