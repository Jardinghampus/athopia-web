import type { Metadata, Viewport } from "next";
import { Suspense } from "react";
import { Geist, Geist_Mono } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import { svSE } from "@clerk/localizations";
import { ThemeProvider } from "@/components/layout/ThemeProvider";
import { Providers } from "./providers";
import { Toaster } from "@/components/ui/sonner";
import { CookieBanner } from "@/components/CookieBanner";
import { UtmVisitTracker } from "@/components/growth/UtmVisitTracker";
import { getSiteUrl } from "@/lib/site-url";
import "./globals.css";

const SITE = getSiteUrl();

const geist = Geist({
  subsets: ["latin"],
  variable: "--font-geist",
  display: "swap",
});

const geistMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-geist-mono",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE),
  manifest: "/manifest.json",
  title: {
    default: "Athopia — Allsvenskan 2026: tabell, resultat & statistik",
    template: "%s | Athopia",
  },
  description:
    "Allt om Allsvenskan 2026 — live-tabell, resultat, spelschema, skytteliga och djupstatistik för alla 16 lag. Matchanalyser, nyhetsflöde och forum för ditt lag, samlat på ett ställe.",
  keywords: [
    "Allsvenskan", "Allsvenskan 2026", "Allsvenskan tabell", "Allsvenskan resultat",
    "Allsvenskan matcher", "Allsvenskan statistik", "Allsvenskan live", "Allsvenskan spelschema",
    "Allsvenskan skytteliga", "svensk fotboll", "fotboll Allsvenskan", "Allsvenskan statistik",
  ],
  openGraph: {
    type: "website",
    locale: "sv_SE",
    url: SITE,
    siteName: "Athopia",
    images: [{ url: "/og-default.png", width: 1200, height: 630 }],
  },
  twitter: {
    card: "summary_large_image",
    site: "@athopia_se",
  },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  // viewport-fit=cover → env(safe-area-inset-*) får värden på notch-enheter
  // (annars är GlassNav:s safe-area-padding en no-op).
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: dark)", color: "#000000" },
    { media: "(prefers-color-scheme: light)", color: "#FAFAF8" },
  ],
};

function NewsMediaJsonLd() {
  return (
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
      "@context": "https://schema.org",
      "@type": "NewsMediaOrganization",
      name: "Athopia",
      url: SITE,
      foundingDate: "2026",
      contactPoint: { "@type": "ContactPoint", email: "hej@athopia.se", contactType: "editorial" },
      publishingPrinciples: `${SITE}/om-oss`,
      inLanguage: "sv",
    })}} />
  );
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const clerkEnabled =
    !!process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY?.match(/^pk_(test|live)_[A-Za-z0-9+/=]+$/);

  const content = (
    <html
      lang="sv"
      className={`${geist.variable} ${geistMono.variable}`}
      suppressHydrationWarning
    >
      <body className="min-h-dvh flex flex-col">
        <NewsMediaJsonLd />
        <ThemeProvider>
          <Providers>
            {children}
            <Toaster position="bottom-right" richColors />
            <CookieBanner />
            <Suspense fallback={null}>
              <UtmVisitTracker />
            </Suspense>
          </Providers>
        </ThemeProvider>
      </body>
    </html>
  );

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return clerkEnabled ? <ClerkProvider localization={svSE as any}>{content}</ClerkProvider> : content;
}
