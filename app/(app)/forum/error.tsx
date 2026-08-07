"use client";

import * as Sentry from "@sentry/nextjs";
import Link from "next/link";
import { useEffect } from "react";

/**
 * Forumträdet är djupt nästlat (forum → [teamSlug] → [postId]) med egna
 * klientkomponenter för feed/tråd — ett fel här ska inte tvinga användaren
 * ur hela produkten, bara tillbaka till forumindexet.
 */
export default function ForumError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <div className="mx-auto flex max-w-md flex-col items-center gap-4 px-5 py-24 text-center">
      <p className="font-mono text-sm tracking-wide text-muted-foreground">Fel</p>
      <h1 className="text-xl font-semibold text-balance text-foreground">Forumet kunde inte visas</h1>
      <p className="text-sm text-muted-foreground">
        Vi loggade felet. Försök igen, eller välj ett annat lags forum.
      </p>
      <div className="mt-2 flex items-center gap-3">
        <button
          onClick={reset}
          className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
        >
          Försök igen
        </button>
        <Link
          href="/forum"
          className="rounded-md border border-border px-4 py-2 text-sm font-medium text-foreground transition-colors hover:border-pitch/40 hover:text-pitch-ink"
        >
          Alla forum
        </Link>
      </div>
    </div>
  );
}
