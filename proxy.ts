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

import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

// Inloggning krävs
const isProtectedRoute = createRouteMatcher([
  "/dashboard(.*)",
  "/konto(.*)",
  "/feed(.*)",
  "/onboarding(.*)",
]);

export default clerkMiddleware(async (auth, req) => {
  if (isProtectedRoute(req)) {
    await auth.protect();
  }
});

export const config = {
  // Kör middleware på alla routes utom Next.js-interna + statiska filer
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};
