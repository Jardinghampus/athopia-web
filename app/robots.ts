/**
 * app/robots.ts — robots.txt
 * Tillåter alla crawlers utom /konto (PRO-gate, inget publikt innehåll).
 */

import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/konto", "/api/"],
      },
    ],
    sitemap: "https://athopia.se/sitemap.xml",
  };
}
