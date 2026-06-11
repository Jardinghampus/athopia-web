import type { Metadata, Viewport } from "next";
import { Instrument_Serif, Lora } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import { ThemeProvider } from "@/components/layout/ThemeProvider";
import { Toaster } from "@/components/ui/sonner";
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
  metadataBase: new URL("https://athopia.se"),
  manifest: "/manifest.json",
  title: {
    default: "Athopia — Allsvenskans hemma på nätet",
    template: "%s | Athopia",
  },
  description:
    "Realtidsnyheter, AI-analys, djupstatistik och ditt lags forum — allt på ett ställe. Allsvenskan-versionen av The Athletic.",
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

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  // viewport-fit=cover → env(safe-area-inset-*) får värden på notch-enheter
  // (annars är MobileNav:s safe-area-padding en no-op).
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
          {children}
          <Toaster position="bottom-right" richColors />
        </ThemeProvider>
      </body>
    </html>
  );

  return clerkEnabled ? <ClerkProvider>{content}</ClerkProvider> : content;
}
