"use client";

/**
 * Polsia 2.0 S2 — growth loop capture.
 * Fires POST /api/utm/visit exactly once per pageview when ?utm_campaign is
 * present in the URL. sessionStorage-guarded so a client-side navigation or
 * re-render doesn't double-count. Renders nothing.
 */
import { useEffect } from "react";
import { usePathname, useSearchParams } from "next/navigation";

const UTM_CAMPAIGN_RE = /^[a-z0-9_-]{3,64}$/;

export function UtmVisitTracker() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    const campaign = searchParams.get("utm_campaign");
    if (!campaign || !UTM_CAMPAIGN_RE.test(campaign)) return;

    const guardKey = `athopia_utm_visit_sent::${campaign}`;
    try {
      if (sessionStorage.getItem(guardKey)) return;
      sessionStorage.setItem(guardKey, "1");
    } catch {
      // sessionStorage otillgängligt (privat läge etc) — skicka ändå, bättre än inget.
    }

    void fetch("/api/utm/visit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ campaign, path: pathname }),
      keepalive: true,
    }).catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams, pathname]);

  return null;
}
