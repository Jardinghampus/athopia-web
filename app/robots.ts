/**
 * app/robots.ts — robots.txt
 * Tillåter alla crawlers utom /konto (PRO-gate, inget publikt innehåll).
 */

import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      { userAgent: "*", allow: "/", disallow: ["/konto", "/api/"] },
      { userAgent: "GPTBot", allow: "/" },
      { userAgent: "ClaudeBot", allow: "/" },
      { userAgent: "PerplexityBot", allow: "/" },
      { userAgent: "Google-Extended", allow: "/" },
      { userAgent: "Applebot-Extended", allow: "/" },
      { userAgent: "Bytespider", allow: "/" },
    ],
    sitemap: "https://athopia.se/sitemap.xml",
  };
}
