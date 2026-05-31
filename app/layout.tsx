import type { Metadata } from "next";
import { Bebas_Neue, DM_Sans } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { CommandPalette } from "@/components/layout/CommandPalette";
import { ThemeProvider } from "@/components/layout/ThemeProvider";
import { AllsvenskanNav } from "@/components/layout/AllsvenskanNav";
import { Toaster } from "@/components/ui/sonner";
import { TeamSelectionModal } from "@/components/ui/TeamSelectionModal";
import { PwaInstallBanner } from "@/components/PwaInstallBanner";
import { Suspense } from "react";
import "./globals.css";

const bebasNeue = Bebas_Neue({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-bebas-neue",
  display: "swap",
});

const dmSans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-dm-sans",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://athopia.se"),
  manifest: "/manifest.json",
  title: {
    default: "Athopia — Fotbollsjournalistik & Live",
    template: "%s | Athopia",
  },
  description:
    "Athopia samlar fotbollsnyheter, live-matchdata, narrativ och podcasts på ett ställe. Följ spelet djupare.",
  keywords: ["fotboll", "allsvenskan", "premier league", "live scores", "fotbollspodcast"],
  openGraph: {
    type: "website",
    locale: "sv_SE",
    url: "https://athopia.se",
    siteName: "Athopia",
    images: [{ url: "/og-default.png", width: 1200, height: 630 }],
  },
  twitter: {
    card: "summary_large_image",
    site: "@athopia_se",
  },
  robots: { index: true, follow: true },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const clerkEnabled =
    !!process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY?.match(/^pk_(test|live)_[A-Za-z0-9+/=]+$/);

  const content = (
    <html
      lang="sv"
      className={`${bebasNeue.variable} ${dmSans.variable}`}
      suppressHydrationWarning
    >
      <body className="min-h-dvh flex flex-col">
        <ThemeProvider>
          <Header clerkEnabled={clerkEnabled} />
          <Suspense fallback={null}>
            <AllsvenskanNav />
          </Suspense>
          <main className="flex-1">{children}</main>
          <Footer />
          <CommandPalette />
          <TeamSelectionModal />
          <PwaInstallBanner />
          <Toaster position="bottom-right" richColors />
        </ThemeProvider>
      </body>
    </html>
  );

  return clerkEnabled ? <ClerkProvider>{content}</ClerkProvider> : content;
}
