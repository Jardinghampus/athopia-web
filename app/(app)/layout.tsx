import { Suspense } from "react";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { CommandPalette } from "@/components/layout/CommandPalette";
import { AppSidebar } from "@/components/layout/AppSidebar";
import { GlassNav } from "@/components/layout/GlassNav";
import { TeamSelectionModal } from "@/components/ui/TeamSelectionModal";
import { PwaInstallBanner } from "@/components/PwaInstallBanner";
import { ForumSummaryPopupGate } from "@/components/ForumSummaryPopupGate";
import { MobileNav } from "@/components/layout/MobileNav";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const clerkEnabled =
    !!process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY?.match(/^pk_(test|live)_[A-Za-z0-9+/=]+$/);

  return (
    <>
      <Header clerkEnabled={clerkEnabled} />
      <div className="flex flex-1 min-h-0">
        <Suspense fallback={null}>
          <AppSidebar />
        </Suspense>
        <main className="flex-1 min-w-0">{children}</main>
      </div>
      <Footer />
      <GlassNav clerkEnabled={clerkEnabled} />
      <CommandPalette />
      {clerkEnabled && (
        <>
          <TeamSelectionModal />
          <PwaInstallBanner />
        </>
      )}
      <Suspense fallback={null}>
        <ForumSummaryPopupGate />
      </Suspense>
      <MobileNav />
    </>
  );
}
