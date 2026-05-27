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
import { NextResponse } from "next/server";

// ─── Publik route-matcher ──────────────────────────────────────────────────────
const isPublicRoute = createRouteMatcher([
  "/",
  "/artikel(.*)",
  "/lag(.*)",
  "/spelare(.*)",
  "/liga(.*)",
  "/podcast(.*)",
  "/prenumerera",
  "/api/webhooks(.*)",  // Stripe webhooks är publika (verifieras med signatur)
]);

// ─── PRO-skyddade routes ───────────────────────────────────────────────────────
const isProRoute = createRouteMatcher([
  "/konto(.*)",
]);

// ─── Middleware ────────────────────────────────────────────────────────────────
export default clerkMiddleware(async (auth, req) => {
  // PRO-routes: kräver login + pro-prenumeration
  if (isProRoute(req)) {
    const { userId, sessionClaims } = await auth();

    // Ej inloggad → redirect till sign-in
    if (!userId) {
      const signInUrl = new URL("/sign-in", req.url);
      signInUrl.searchParams.set("redirect_url", req.url);
      return NextResponse.redirect(signInUrl);
    }

    // Inloggad men inte PRO → redirect till prenumerera
    const tier = (sessionClaims?.publicMetadata as { subscriptionTier?: string })
      ?.subscriptionTier;
    if (tier !== "pro") {
      return NextResponse.redirect(new URL("/prenumerera", req.url));
    }
  }

  // Skydda alla icke-publika routes (kräver login)
  if (!isPublicRoute(req)) {
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
