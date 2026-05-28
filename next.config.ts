/**
 * next.config.ts — Athopia Next.js-konfiguration
 *
 * images.remotePatterns: tillåter bilder från Supabase Storage och Sportsmonks CDN.
 */

import type { NextConfig } from "next";

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
      // Sportsmonks CDN
      {
        protocol: "https",
        hostname: "cdn.sportmonks.com",
      },
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

export default nextConfig;
