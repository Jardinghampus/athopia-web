/**
 * proxy.ts (f.d. middleware.ts — Next.js 16-konvention)
 * ─────────────────────────────────────────────────────────────────────────────
 * Clerk-baserat route-skydd för Athopia (publik webb).
 *
 * Beslut:
 * - Athopia-web har INGEN admin. All admin ligger i athopia-admin (os.athopia.se).
 * - Skyddade routes (/dashboard, /konto, /feed, /onboarding): kräver inloggning.
 * - Allt annat är öppet (publik nyhetswebb).
 *
 * clerkMiddleware() körs via Vercel Fluid Compute (Node.js runtime).
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { NextResponse } from "next/server";
import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

// Inloggning krävs
const isProtectedRoute = createRouteMatcher([
  "/dashboard(.*)",
  "/konto(.*)",
  "/feed(.*)",
  "/onboarding(.*)",
]);

// Polsia 2.0 S2 — growth loop: capture utm_campaign i en cookie (30 dagar).
// Ingen DB-write här — bara attribution-läsning för /api/utm/visit och
// onboarding-flödet. Regex-validering görs igen på serversidan innan insert.
const UTM_CAMPAIGN_RE = /^[a-z0-9_-]{3,64}$/;

export default clerkMiddleware(async (auth, req) => {
  if (isProtectedRoute(req)) {
    await auth.protect();
  }

  const utmCampaign = req.nextUrl.searchParams.get("utm_campaign");
  if (utmCampaign && UTM_CAMPAIGN_RE.test(utmCampaign)) {
    const res = NextResponse.next();
    res.cookies.set("athopia_utm", utmCampaign, {
      maxAge: 60 * 60 * 24 * 30,
      httpOnly: true,
      sameSite: "lax",
      path: "/",
    });
    return res;
  }
});

export const config = {
  // Kör middleware på alla routes utom Next.js-interna + statiska filer
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};
