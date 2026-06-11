/**
 * proxy.ts (f.d. middleware.ts — byt namn i Next.js 16)
 * ─────────────────────────────────────────────────────────────────────────────
 * Clerk-baserat route-skydd för Athopia.
 *
 * Beslut:
 * - Admin-routes (/admin/*, /api/admin/*): kräver inloggning OCH att Clerk
 *   user-ID finns i ADMIN_USER_IDS (allowlist). Sidor → redirect, API → 403.
 * - Skyddade routes (/dashboard, /konto, /feed, /onboarding): kräver inloggning.
 * - Allt annat är öppet (publik nyhetswebb).
 *
 * clerkMiddleware() körs via Vercel Fluid Compute (Node.js runtime).
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { isAdminUser } from "@/lib/admin";

// Admin — kräver inloggning OCH allowlist (ADMIN_USER_IDS)
const isAdminRoute = createRouteMatcher(["/admin(.*)", "/api/admin(.*)"]);
const isAdminApiRoute = createRouteMatcher(["/api/admin(.*)"]);

// Inloggning krävs (utan admin-allowlist)
const isProtectedRoute = createRouteMatcher([
  "/dashboard(.*)",
  "/konto(.*)",
  "/feed(.*)",
  "/onboarding(.*)",
]);

export default clerkMiddleware(async (auth, req) => {
  if (isAdminRoute(req)) {
    const { userId, redirectToSignIn } = await auth();
    if (!isAdminUser(userId)) {
      if (isAdminApiRoute(req)) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
      if (!userId) return redirectToSignIn();
      return NextResponse.redirect(new URL("/", req.url));
    }
    return;
  }

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
