"use client";

import * as Sentry from "@sentry/nextjs";
import Link from "next/link";
import { useEffect } from "react";

/**
 * Fångar fel inom (app)-routegruppen (produktytorna) närmare källan än
 * rot-error.tsx — samma visuella språk som app/error.tsx och app/not-found.tsx,
 * men med en väg tillbaka till en produktyta i stället för bara reset().
 */
export default function AppError({
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
    <div className="mx-auto flex max-w-md flex-col items-center gap-4 px-5 py-24 text-center sm:py-28">
      <p className="font-mono text-sm tracking-wide text-muted-foreground">Fel</p>
      <h1 className="text-xl font-semibold text-balance text-foreground">Något gick fel</h1>
      <p className="text-sm text-muted-foreground">
        Vi loggade felet. Försök igen om en stund, eller gå till en annan sida.
      </p>
      <div className="mt-2 flex items-center gap-3">
        <button
          onClick={reset}
          className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
        >
          Försök igen
        </button>
        <Link
          href="/mitt-lag"
          className="rounded-md border border-border px-4 py-2 text-sm font-medium text-foreground transition-colors hover:border-pitch/40 hover:text-pitch-ink"
        >
          Till startsidan
        </Link>
      </div>
    </div>
  );
}
