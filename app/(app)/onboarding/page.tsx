import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { currentUser } from "@clerk/nextjs/server";
import { OnboardingClient } from "./OnboardingClient";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Välj ditt lag | Athopia",
  description: "Välj vilket Allsvenskan-lag du följer för personaliserade nyheter och notiser.",
  robots: { index: false, follow: false },
};

export default async function OnboardingPage() {
  const user = await currentUser();

  // Inloggad + har redan valt lag → skippa onboarding
  if (user) {
    const meta = user.unsafeMetadata as Record<string, unknown> | undefined;
    if (meta?.["favoriteTeam"]) {
      redirect("/feed");
    }
  }

  return <OnboardingClient />;
}
