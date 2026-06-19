import * as Sentry from "@sentry/nextjs";

const dsn = process.env.SENTRY_DSN ?? process.env.NEXT_PUBLIC_SENTRY_DSN;
const isProduction = process.env.VERCEL_ENV === "production";

if (dsn) {
  Sentry.init({
    dsn,
    environment: process.env.VERCEL_ENV ?? process.env.NODE_ENV,
    tracesSampleRate: isProduction ? 0.05 : 1.0,
    enableLogs: true,
    sendDefaultPii: true,
  });
}
