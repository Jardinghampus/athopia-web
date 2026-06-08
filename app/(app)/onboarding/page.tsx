import type { Metadata } from "next";
import { OnboardingClient } from "./OnboardingClient";

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: "Välj ditt lag | Athopia",
  description: "Välj vilket Allsvenskan-lag du följer för personaliserade nyheter och notiser.",
  robots: { index: false, follow: false },
};

export default function OnboardingPage() {
  return <OnboardingClient />;
}
