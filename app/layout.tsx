import type { Metadata, Viewport } from "next";
import { Instrument_Serif, Lora } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import { svSE } from "@clerk/localizations";
import { ThemeProvider } from "@/components/layout/ThemeProvider";
import { Providers } from "./providers";
import { Toaster } from "@/components/ui/sonner";
import { CookieBanner } from "@/components/CookieBanner";
import "./globals.css";

const instrumentSerif = Instrument_Serif({
  weight: "400",
  style: ["normal", "italic"],
  subsets: ["latin"],
  variable: "--font-instrument-serif",
  display: "swap",
});

const lora = Lora({
  subsets: ["latin"],
  style: ["normal", "italic"],
  variable: "--font-lora",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://www.athopia.se"),
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
    url: "https://www.athopia.se",
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
    { media: "(prefers-color-scheme: dark)", color: "#0A0A0A" },
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
  ],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const clerkEnabled =
    !!process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY?.match(/^pk_(test|live)_[A-Za-z0-9+/=]+$/);

  const content = (
    <html
      lang="sv"
      className={`${instrumentSerif.variable} ${lora.variable}`}
      suppressHydrationWarning
    >
      <body className="min-h-dvh flex flex-col">
        <ThemeProvider>
          <Providers>
            {children}
            <Toaster position="bottom-right" richColors />
            <CookieBanner />
          </Providers>
        </ThemeProvider>
      </body>
    </html>
  );

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return clerkEnabled ? <ClerkProvider localization={svSE as any}>{content}</ClerkProvider> : content;
}
