"use client";

import { useEffect, useState } from "react";
import { usePwaInstall, usePushPermission, useVisitCount, useServiceWorker, PUSH_PROMPTED_KEY } from "@/hooks/usePwa";
import { useFavoriteTeam } from "@/hooks/useFavoriteTeam";

export function PwaInstallBanner() {
  const { swReady } = useServiceWorker();
  const visitCount = useVisitCount();
  const { canInstall, triggerInstall, dismissInstall } = usePwaInstall();
  const { status: pushStatus, isSubscribed, requestPermission } = usePushPermission();
  const { slug: favoriteTeam } = useFavoriteTeam();
  const [showPushPrompt, setShowPushPrompt] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  // Visa push-prompt efter 3 besök (om ej redan frågat)
  useEffect(() => {
    if (!swReady) return;
    if (typeof window === "undefined") return;
    const alreadyPrompted = window.localStorage.getItem(PUSH_PROMPTED_KEY) === "1";
    if (visitCount >= 2 && !alreadyPrompted && pushStatus === "default" && !isSubscribed) {
      setShowPushPrompt(true);
    }
  }, [swReady, visitCount, pushStatus, isSubscribed]);

  const handlePushAccept = async () => {
    const teamIds: string[] = [];
    if (favoriteTeam) {
      try {
        const res = await fetch("/api/team/list");
        const json = (await res.json()) as { teams?: { id: string; slug: string }[] };
        const match = json.teams?.find((t) => t.slug === favoriteTeam);
        if (match?.id) teamIds.push(match.id);
      } catch {
        // Fortsätt utan lag-filter — prenumeration sparas ändå
      }
    }
    await requestPermission(teamIds);
    setShowPushPrompt(false);
  };

  const handlePushDismiss = () => {
    if (typeof window !== "undefined") {
      window.localStorage.setItem(PUSH_PROMPTED_KEY, "1");
    }
    setShowPushPrompt(false);
  };

  if (dismissed) return null;

  // Push-prompt (prioritet över install-banner)
  if (showPushPrompt) {
    return (
      <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-96 z-40 bg-card border border-border rounded-xl shadow-lg p-4">
        <div className="flex items-start gap-3">
          <div className="text-2xl">🔔</div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-foreground">Aktivera push-notiser</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              Få direktnotis om mål, transfernyheter och AI-rapporter
              {favoriteTeam ? ` för ${favoriteTeam}` : ""}.
            </p>
            <div className="flex gap-2 mt-3">
              <button
                onClick={handlePushAccept}
                className="px-3 py-1.5 bg-pitch text-white text-xs font-medium rounded-lg hover:bg-pitch/90 transition-colors"
              >
                Aktivera
              </button>
              <button
                onClick={handlePushDismiss}
                className="px-3 py-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                Inte nu
              </button>
            </div>
          </div>
          <button
            onClick={handlePushDismiss}
            className="text-muted-foreground hover:text-foreground text-lg leading-none"
            aria-label="Stäng"
          >
            ×
          </button>
        </div>
      </div>
    );
  }

  // Install-banner (beforeinstallprompt)
  if (canInstall) {
    return (
      <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-96 z-40 bg-card border border-border rounded-xl shadow-lg p-4">
        <div className="flex items-start gap-3">
          <div className="text-2xl">📲</div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-foreground">Lägg till på hemskärmen</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              Installera Athopia som app för snabbare access och offline-stöd.
            </p>
            <div className="flex gap-2 mt-3">
              <button
                onClick={triggerInstall}
                className="px-3 py-1.5 bg-pitch text-white text-xs font-medium rounded-lg hover:bg-pitch/90 transition-colors"
              >
                Installera
              </button>
              <button
                onClick={() => { dismissInstall(); setDismissed(true); }}
                className="px-3 py-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                Inte nu
              </button>
            </div>
          </div>
          <button
            onClick={() => { dismissInstall(); setDismissed(true); }}
            className="text-muted-foreground hover:text-foreground text-lg leading-none"
            aria-label="Stäng"
          >
            ×
          </button>
        </div>
      </div>
    );
  }

  return null;
}
