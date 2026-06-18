/**
 * instrumentation-client.ts — Sentry browser-init (Next.js 16).
 *
 * Initierar BARA om NEXT_PUBLIC_SENTRY_DSN finns och endast i produktion.
 */
import * as Sentry from "@sentry/nextjs";

const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN;

if (dsn && process.env.NEXT_PUBLIC_VERCEL_ENV === "production") {
  Sentry.init({
    dsn,
    environment: process.env.NEXT_PUBLIC_VERCEL_ENV ?? "production",
    tracesSampleRate: 0.05,
    // Session replay endast vid fel — håller volymen nere vid skala.
    replaysOnErrorSampleRate: 0.1,
    replaysSessionSampleRate: 0,
  });
}

export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;
