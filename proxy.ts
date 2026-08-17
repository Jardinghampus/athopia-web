/**
 * proxy.ts (f.d. middleware.ts — Next.js 16-konvention)
 * ─────────────────────────────────────────────────────────────────────────────
 * Clerk-baserat route-skydd för Athopia (publik webb).
 *
 * Beslut:
 * - Athopia-web har INGEN admin. All admin ligger i athopia-admin (os.athopia.se).
 * - Skyddade routes (/dashboard, /konto, /feed): kräver inloggning.
 * - /onboarding är öppet — gäster ska kunna välja lag utan konto (LAUNCH-05).
 * - WAITLIST_MODE: /sign-up stängs och pekas om till /vaenta. /sign-in är ORÖRD —
 *   den som redan blivit inbjuden måste kunna logga in. Inloggade som hamnar på
 *   /vaenta skickas till /mitt-lag, samma mönster som / redan använder.
 * - Allt annat är öppet (publik nyhetswebb).
 *
 * clerkMiddleware() körs via Vercel Fluid Compute (Node.js runtime).
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { NextResponse } from "next/server";
import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { isWaitlistMode } from "@/lib/waitlist/mode";

// Inloggning krävs
const isProtectedRoute = createRouteMatcher([
  "/dashboard(.*)",
  "/konto(.*)",
  "/feed(.*)",
]);

// Polsia 2.0 S2 — growth loop: capture utm_campaign i en cookie (30 dagar).
// Ingen DB-write här — bara attribution-läsning för /api/utm/visit och
// onboarding-flödet. Regex-validering görs igen på serversidan innan insert.
const UTM_CAMPAIGN_RE = /^[a-z0-9_-]{3,64}$/;

const isSignUpRoute = createRouteMatcher(["/sign-up(.*)"]);

export default clerkMiddleware(async (auth, req) => {
  const waitlistMode = isWaitlistMode();

  if (waitlistMode && isSignUpRoute(req)) {
    return NextResponse.redirect(new URL("/vaenta", req.url));
  }

  if (req.nextUrl.pathname === "/vaenta") {
    const { userId } = await auth();
    if (userId) return NextResponse.redirect(new URL("/mitt-lag", req.url));
  }

  if (isProtectedRoute(req)) {
    // Explicit mål i stället för Clerks fallback. Utan `unauthenticatedUrl`
    // härleder Clerk sign-in-adressen ur miljövariabler, och i produktion —
    // där NEXT_PUBLIC_CLERK_SIGN_IN_URL saknades — gav den 404 i stället för
    // att skicka besökaren till inloggningen. En utloggad som klickade "Konto"
    // från /mer möttes alltså av en 404-sida. Lokalt syntes det aldrig,
    // eftersom .env.local har variabeln satt.
    await auth.protect({
      unauthenticatedUrl: new URL("/sign-in", req.url).toString(),
    });
  }

  // LCP-fix: landningssidan (/) körde tidigare currentUser() i render-trädet
  // för att redirecta inloggade användare till /mitt-lag. Det tvingar Next
  // att behandla HELA routen som force-dynamic (ISR-cache populeras aldrig,
  // TTFB 1.5-2.2s på varje request — verifierat, se LCP-utredning). Flyttar
  // session-kollen hit (edge JWT, ingen nätverksrunda) så page.tsx blir
  // statisk/ISR-cachebar för alla utloggade besökare (majoriteten).
  if (req.nextUrl.pathname === "/") {
    const { userId } = await auth();
    if (userId) {
      return NextResponse.redirect(new URL("/mitt-lag", req.url));
    }
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
