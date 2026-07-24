import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { currentUser } from "@clerk/nextjs/server";
import { recordAttributedEvent } from "@/lib/social-attribution";
import { OnboardingClient } from "./OnboardingClient";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Välkommen | Athopia",
  description: "Välj ditt lag och anpassa Athopia efter dig.",
  robots: { index: false, follow: false },
};

/**
 * Polsia 2.0 S2 — growth loop signup attribution.
 *
 * Decision (see commit message): Clerk's user.created webhook fires
 * server-to-server and never carries the visitor's browser cookies, so
 * `athopia_utm` is not readable there. The onboarding page is the first
 * server-rendered page a brand-new user hits after signup, so we read the
 * cookie here instead — simplest path that actually has cookie access.
 * Idempotent: a signup row is only inserted once per (clerk_user_id).
 */
async function recordUtmSignupIfNeeded(clerkUserId: string): Promise<void> {
  await recordAttributedEvent({
    event: "signup",
    clerkUserId,
    path: "/onboarding",
  });
}

export default async function OnboardingPage() {
  const user = await currentUser();
  if (user) {
    const meta = user.unsafeMetadata as Record<string, unknown> | undefined;
    if (meta?.["favoriteTeam"] || meta?.["onboardingDone"] === true) redirect("/feed");
    await recordUtmSignupIfNeeded(user.id);
  }
  return <OnboardingClient />;
}
