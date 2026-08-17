import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { currentUser } from "@clerk/nextjs/server";
import { OnboardingClient } from "./OnboardingClient";
import { recordUtmMilestone } from "@/lib/utm-attribution";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Välkommen | Athopia",
  description: "Välj ditt lag och anpassa Athopia efter dig.",
  robots: { index: false, follow: false },
};

/**
 * Polsia 2.0 S2 — growth loop signup attribution.
 * Onboarding is the first cookie-bearing page after signup (Clerk webhook
 * has no browser cookies). Idempotent via utm_events unique indexes.
 */
async function recordUtmSignupIfNeeded(clerkUserId: string): Promise<void> {
  await recordUtmMilestone({
    event: "signup",
    clerkUserId,
    path: "/onboarding",
  });
}

export default async function OnboardingPage() {
  let presetTeam: string | null = null;

  const user = await currentUser();
  if (user) {
    await recordUtmSignupIfNeeded(user.id);
    const meta = user.unsafeMetadata as Record<string, unknown> | undefined;

    // Klar onboarding = ingen onboarding.
    if (meta?.["onboardingDone"] === true) redirect("/feed");

    // Kom hen via waitlisten är laget redan valt (speglat i user.created-
    // webhooken). Då hoppar vi lagsteget — men INTE hela onboardingen: hen har
    // aldrig sett push-frågan, och att tysta bort den vore mer överraskande än
    // att visa den. Tidigare redirectade den här raden på `favoriteTeam` och
    // gjorde just det.
    const team = meta?.["favoriteTeam"];
    if (typeof team === "string" && team.length > 0) presetTeam = team;
  }

  return <OnboardingClient presetTeam={presetTeam} />;
}
