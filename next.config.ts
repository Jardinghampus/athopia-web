/**
 * next.config.ts — Athopia Next.js-konfiguration
 *
 * images.remotePatterns: tillåter bilder från Supabase Storage och externa CDN:er.
 */

import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs";

const nextConfig: NextConfig = {
  // Turbopack root — fix för pnpm workspace med mehrere lockfiles
  turbopack: {
    root: __dirname,
  },
  experimental: {
    // Tree-shake barrel-exporter för att minska klientbundlen
    optimizePackageImports: ["lucide-react", "sonner", "@clerk/nextjs"],
  },
  images: {
    remotePatterns: [
      // Supabase Storage
      {
        protocol: "https",
        hostname: "*.supabase.co",
        pathname: "/storage/v1/object/public/**",
      },
      // Externt CDN (lagbilder synkade via athopia-os)
      {
        protocol: "https",
        hostname: "*.cloudfront.net",
      },
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
    ],
  },
};

/**
 * Sentry wrappas BARA när source-map-upload är konfigurerat (org+projekt+token).
 * Saknas något → ren Next-config, så builden aldrig kan fela pga Sentry-pluginen.
 * Runtime-felrapportering (instrumentation*.ts) fungerar oavsett.
 */
const sentryReady =
  !!process.env.SENTRY_AUTH_TOKEN &&
  !!process.env.SENTRY_ORG &&
  !!process.env.SENTRY_PROJECT;

export default sentryReady
  ? withSentryConfig(nextConfig, {
      org: process.env.SENTRY_ORG,
      project: process.env.SENTRY_PROJECT,
      silent: !process.env.CI,
      widenClientFileUpload: true,
      disableLogger: true,
    })
  : nextConfig;
