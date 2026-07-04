"use client";

import { useState } from "react";
import { Share2, Check } from "lucide-react";

/** Dela via native share sheet (mobil) med kopiera-länk-fallback (desktop). */
export function ShareButton({ title, url }: { title: string; url: string }) {
  const [copied, setCopied] = useState(false);

  const share = async () => {
    try {
      if (navigator.share) {
        await navigator.share({ title, url });
        return;
      }
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Avbruten share-sheet är inte ett fel
    }
  };

  return (
    <button
      onClick={share}
      className="inline-flex items-center gap-1.5 rounded-full border border-border/60 px-3 py-1.5 text-xs text-muted-foreground hover:text-foreground hover:border-pitch/50 transition-colors"
      aria-label="Dela"
    >
      {copied ? <Check className="w-3.5 h-3.5 text-pitch" /> : <Share2 className="w-3.5 h-3.5" />}
      {copied ? "Länk kopierad" : "Dela"}
    </button>
  );
}
