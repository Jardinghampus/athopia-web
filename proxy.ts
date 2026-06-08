/**
 * proxy.ts (f.d. middleware.ts — byt namn i Next.js 16)
 * ─────────────────────────────────────────────────────────────────────────────
 * Clerk-baserad route-skydd för Athopia.
 *
 * Beslut:
 * - publicRoutes: öppna sidor som inte kräver login.
 * - PRO-gate: /konto/* kräver att användaren är inloggad OCH har
 *   subscriptionTier='pro' i Clerk publicMetadata.
 *   Om kravet inte uppfylls → redirect till /prenumerera.
 *
 * Clerk's clerkMiddleware() körs via Vercel Fluid Compute (Node.js runtime).
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

// /dashboard kräver login — allt annat är öppet (Clerk temp semi-disabled)
const isDashboard = createRouteMatcher(['/dashboard(.*)']);

export default clerkMiddleware(async (auth, req) => {
  if (isDashboard(req)) await auth.protect();
});

export const config = {
  // Kör middleware på alla routes utom Next.js-interna + statiska filer
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};
