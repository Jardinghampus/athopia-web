"use client";

/**
 * Polsia 2.0 S2 — growth loop capture.
 * Fires POST /api/utm/visit exactly once per pageview when ?utm_campaign is
 * present in the URL. sessionStorage-guarded so a client-side navigation or
 * re-render doesn't double-count. Renders nothing.
 */
import { useEffect } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { getStoredConsent } from "@/lib/cookieConsent";

const UTM_CAMPAIGN_RE = /^[a-z0-9_-]{3,64}$/;

export function UtmVisitTracker() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    let inFlight = false;
    const sendVisit = () => {
      if (getStoredConsent()?.analytics !== true) return;
      const campaign = searchParams.get("utm_campaign");
      if (!campaign || !UTM_CAMPAIGN_RE.test(campaign)) return;

      const guardKey = `athopia_utm_visit_sent::${campaign}`;
      try {
        if (sessionStorage.getItem(guardKey)) return;
      } catch {
        // sessionStorage otillgängligt (privat läge etc) — fortsätt utan guard.
      }
      if (inFlight) return;
      inFlight = true;

      void fetch("/api/utm/visit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ campaign, path: pathname }),
        keepalive: true,
      })
        .then((response) => {
          if (response.status !== 200) return;
          try {
            sessionStorage.setItem(guardKey, "1");
          } catch {
            // Privat läge: servern har ändå registrerat besöket.
          }
        })
        .catch(() => {})
        .finally(() => {
          inFlight = false;
        });
    };

    sendVisit();
    window.addEventListener("athopia:consent-updated", sendVisit);
    return () => window.removeEventListener("athopia:consent-updated", sendVisit);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams, pathname]);

  return null;
}
