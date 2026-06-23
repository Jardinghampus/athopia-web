import { Suspense } from "react";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { CommandPalette } from "@/components/layout/CommandPalette";
import { AllsvenskanNav } from "@/components/layout/AllsvenskanNav";
import { AppSidebar } from "@/components/layout/AppSidebar";
import { GlassNav } from "@/components/layout/GlassNav";
import { TeamSelectionModal } from "@/components/ui/TeamSelectionModal";
import { PwaInstallBanner } from "@/components/PwaInstallBanner";
import { ForumSummaryPopup } from "@/components/ForumSummaryPopup";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const clerkEnabled =
    !!process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY?.match(/^pk_(test|live)_[A-Za-z0-9+/=]+$/);

  return (
    <>
      <Header clerkEnabled={clerkEnabled} />
      <Suspense fallback={null}>
        <AllsvenskanNav />
      </Suspense>
      <div className="flex flex-1 min-h-0">
        <AppSidebar />
        <main className="flex-1 min-w-0">{children}</main>
      </div>
      <Footer />
      <GlassNav />
      <CommandPalette />
      {clerkEnabled && (
        <>
          <TeamSelectionModal />
          <PwaInstallBanner />
        </>
      )}
      <ForumSummaryPopup />
    </>
  );
}
