/**
 * app/layout.tsx
 * ─────────────────────────────────────────────────────────────────────────────
 * Root layout för Athopia.
 *
 * Beslut:
 * - ClerkProvider wrappas runt hela appen för auth-kontext.
 * - Bebas Neue (rubriker) + DM Sans (brödtext) laddas via next/font/google.
 *   Font-variablerna --font-bebas-neue och --font-dm-sans sätts på <html> och
 *   mappas i globals.css @theme till --font-heading och --font-sans.
 * - dark class på <html> enforcar dark-first design.
 * - Sonner-toaster monteras globalt för notifikationer.
 * ─────────────────────────────────────────────────────────────────────────────
 */

import type { Metadata } from "next";
import { Bebas_Neue, DM_Sans } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Toaster } from "@/components/ui/sonner";
import "./globals.css";

// ─── Typsnitt ──────────────────────────────────────────────────────────────────
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

// ─── Metadata ──────────────────────────────────────────────────────────────────
export const metadata: Metadata = {
  metadataBase: new URL("https://athopia.se"),
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

// ─── Root Layout ───────────────────────────────────────────────────────────────
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // ClerkProvider kräver giltig pk_live_/pk_test_ nyckel
  const clerkEnabled =
    !!process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY?.match(/^pk_(test|live)_[A-Za-z0-9+/=]+$/);

  const content = (
    <html
      lang="sv"
      className={`dark ${bebasNeue.variable} ${dmSans.variable}`}
      suppressHydrationWarning
    >
      <body className="min-h-dvh flex flex-col">
        <Header clerkEnabled={clerkEnabled} />
        <main className="flex-1">{children}</main>
        <Footer />
        <Toaster position="bottom-right" theme="dark" richColors />
      </body>
    </html>
  );

  return clerkEnabled ? <ClerkProvider>{content}</ClerkProvider> : content;
}
