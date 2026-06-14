import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { currentUser } from "@clerk/nextjs/server";
import { OnboardingClient } from "./OnboardingClient";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Välkommen | Athopia",
  description: "Välj ditt lag och anpassa Athopia efter dig.",
  robots: { index: false, follow: false },
};

export default async function OnboardingPage() {
  const user = await currentUser();
  if (user) {
    const meta = user.unsafeMetadata as Record<string, unknown> | undefined;
    if (meta?.["favoriteTeam"]) redirect("/feed");
  }
  return <OnboardingClient />;
}
