import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

const isPublicRoute = createRouteMatcher([
  "/",
  "/sign-in(.*)",
  "/sign-up(.*)",
  "/artikel(.*)",
  "/nyheter(.*)",
  "/allsvenskan(.*)",
  "/narrativ(.*)",
  "/analys(.*)",
  "/lag(.*)",
  "/spelare(.*)",
  "/liga(.*)",
  "/podcast(.*)",
  "/prenumerera(.*)",
  "/statistik(.*)",
  "/forum(.*)",
  "/sammanfattning(.*)",
  "/match(.*)",
  "/feed(.*)",
  "/api/webhooks(.*)",
  "/api/gamification/weekly-reset",
]);

const isOnboardingRoute = createRouteMatcher(["/onboarding"]);

const isAuthRoute = createRouteMatcher([
  "/konto(.*)",
  "/onboarding(.*)",
  "/admin(.*)",
  "/profil(.*)",
  "/api/forum(.*)",
  "/api/gamification/predict",
  "/api/gamification/reveal",
  "/api/gamification/track-read",
  "/api/gamification/use-freeze",
  "/api/push(.*)",
  "/api/create-checkout",
]);

export default clerkMiddleware(async (auth, req) => {
  if (isAuthRoute(req) && !isOnboardingRoute(req)) {
    const { userId, sessionClaims } = await auth();
    if (!userId) {
      const signInUrl = new URL("/sign-in", req.url);
      signInUrl.searchParams.set("redirect_url", req.url);
      return NextResponse.redirect(signInUrl);
    }

    // Onboarding-redirect: inloggad utan favoriteTeam
    if (sessionClaims?.unsafeMetadata !== undefined) {
      const meta = sessionClaims.unsafeMetadata as Record<string, unknown>;
      if (!meta["favoriteTeam"] && !req.nextUrl.pathname.startsWith("/konto")) {
        return NextResponse.redirect(new URL("/onboarding", req.url));
      }
    }
  }

  if (!isPublicRoute(req) && !isAuthRoute(req)) {
    await auth.protect();
  }
});

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};
