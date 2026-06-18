/**
 * instrumentation.ts — Sentry server/edge-init (Next.js 16).
 *
 * Körs en gång vid serverstart. Initierar BARA om SENTRY_DSN finns, så att
 * lokal utveckling och preview utan DSN fungerar utan brus.
 */
import * as Sentry from "@sentry/nextjs";

export async function register() {
  const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN ?? process.env.SENTRY_DSN;
  if (!dsn) return;

  if (process.env.NEXT_RUNTIME === "nodejs" || process.env.NEXT_RUNTIME === "edge") {
    Sentry.init({
      dsn,
      environment: process.env.VERCEL_ENV ?? "development",
      // Vid 100K användare: sampla traces lågt för att hålla kostnad/volym nere.
      tracesSampleRate: 0.05,
      enabled: process.env.VERCEL_ENV === "production",
    });
  }
}

export const onRequestError = Sentry.captureRequestError;
