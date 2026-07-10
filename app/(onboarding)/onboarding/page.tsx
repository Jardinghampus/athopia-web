import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { currentUser } from "@clerk/nextjs/server";
import { createServiceClient } from "@/lib/supabase";
import { OnboardingClient } from "./OnboardingClient";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Välkommen | Athopia",
  description: "Välj ditt lag och anpassa Athopia efter dig.",
  robots: { index: false, follow: false },
};

const UTM_CAMPAIGN_RE = /^[a-z0-9_-]{3,64}$/;

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
  const cookieStore = await cookies();
  const campaign = cookieStore.get("athopia_utm")?.value;
  if (!campaign || !UTM_CAMPAIGN_RE.test(campaign)) return;

  try {
    const supabase = createServiceClient();
    const { data: existing } = await supabase
      .from("utm_events")
      .select("id")
      .eq("clerk_user_id", clerkUserId)
      .eq("event", "signup")
      .maybeSingle();
    if (existing) return;

    await supabase.from("utm_events").insert({
      campaign,
      path: "/onboarding",
      event: "signup",
      clerk_user_id: clerkUserId,
    });
  } catch (err) {
    console.error("[onboarding] utm signup attribution fel:", err);
  }
}

export default async function OnboardingPage() {
  const user = await currentUser();
  if (user) {
    await recordUtmSignupIfNeeded(user.id);
    const meta = user.unsafeMetadata as Record<string, unknown> | undefined;
    if (meta?.["favoriteTeam"] || meta?.["onboardingDone"] === true) redirect("/feed");
  }
  return <OnboardingClient />;
}
