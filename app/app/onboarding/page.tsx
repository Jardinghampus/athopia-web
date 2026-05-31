import type { Metadata } from "next";
import { TeamSelectionModal } from "@/components/ui/TeamSelectionModal";

export const metadata: Metadata = {
  title: "Välj ditt lag",
  description: "Välj vilket Allsvenskan-lag du följer för personaliserade nyheter och notiser.",
  robots: { index: false, follow: false },
};

export default function OnboardingPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <TeamSelectionModal forceVisible />
    </div>
  );
}
