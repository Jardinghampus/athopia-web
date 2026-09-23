"use client";

import { useState } from "react";
import { X } from "lucide-react";
import { usePwaInstall } from "@/hooks/usePwa";

/**
 * Install-banner för PWA. Push-behörighet hör inte hemma här —
 * den begärs just-in-time när användaren trycker på en notis-funktion
 * (`usePushPermission`, mobil UX-regel 20), aldrig efter ett besöksantal.
 */
export function PwaInstallBanner() {
  const { canInstall, triggerInstall, dismissInstall } = usePwaInstall();
  const [dismissed, setDismissed] = useState(false);

  if (dismissed || !canInstall) return null;

  return (
    <div className="glass fixed bottom-4 left-4 right-4 z-40 p-4 md:left-auto md:right-4 md:w-96">
      <div className="flex items-start gap-3">
        <div className="text-2xl" aria-hidden>
          📲
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-foreground">Lägg till på hemskärmen</p>
          <p className="text-xs text-muted-foreground mt-0.5">
            Installera Nano Fotboll som app för snabbare access och offline-stöd.
          </p>
          <div className="flex gap-2 mt-3">
            <button
              type="button"
              onClick={triggerInstall}
              data-cta="primary"
              className="inline-flex min-h-11 min-w-11 items-center justify-center px-3 bg-pitch text-white text-xs font-medium rounded-lg hover:bg-pitch/90 transition-colors"
            >
              Installera
            </button>
            <button
              type="button"
              onClick={() => {
                dismissInstall();
                setDismissed(true);
              }}
              className="inline-flex min-h-11 min-w-11 items-center justify-center px-3 text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              Inte nu
            </button>
          </div>
        </div>
        <button
          type="button"
          onClick={() => {
            dismissInstall();
            setDismissed(true);
          }}
          className="inline-flex size-11 shrink-0 items-center justify-center rounded-full text-muted-foreground hover:text-foreground"
          aria-label="Stäng"
        >
          <X className="size-4" aria-hidden />
        </button>
      </div>
    </div>
  );
}
