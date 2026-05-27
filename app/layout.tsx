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
import Link from "next/link";
import { SignedIn, SignedOut, UserButton, SignInButton } from "@clerk/nextjs";
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

// ─── Navigationbar ─────────────────────────────────────────────────────────────
function SiteHeader() {
  return (
    <header className="sticky top-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between gap-4">
        {/* Logo */}
        <Link
          href="/"
          className="font-heading text-2xl text-pitch hover:text-pitch-light transition-colors"
          aria-label="Athopia startsida"
        >
          ATHOPIA
        </Link>

        {/* Primärnavigation */}
        <nav className="hidden md:flex items-center gap-6 text-sm text-muted-foreground">
          <Link href="/artikel" className="hover:text-foreground transition-colors">
            Nyheter
          </Link>
          <Link href="/podcast" className="hover:text-foreground transition-colors">
            Podcast
          </Link>
          <Link href="/lag" className="hover:text-foreground transition-colors">
            Lag
          </Link>
        </nav>

        {/* Auth */}
        <div className="flex items-center gap-3">
          <SignedOut>
            <SignInButton mode="modal">
              <button className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                Logga in
              </button>
            </SignInButton>
            <Link
              href="/prenumerera"
              className="text-sm px-4 py-1.5 rounded-full pitch-gradient text-white font-medium hover:opacity-90 transition-opacity"
            >
              PRO
            </Link>
          </SignedOut>
          <SignedIn>
            <Link
              href="/konto"
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Konto
            </Link>
            <UserButton afterSignOutUrl="/" />
          </SignedIn>
        </div>
      </div>
    </header>
  );
}

// ─── Sidfot ────────────────────────────────────────────────────────────────────
function SiteFooter() {
  return (
    <footer className="border-t border-border/50 mt-24 py-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
        <span className="font-heading text-lg text-pitch">ATHOPIA</span>
        <p>© {new Date().getFullYear()} Athopia. Fotboll på djupet.</p>
        <div className="flex gap-4">
          <Link href="/prenumerera" className="hover:text-foreground transition-colors">
            PRO
          </Link>
          <Link href="/integritetspolicy" className="hover:text-foreground transition-colors">
            Integritet
          </Link>
        </div>
      </div>
    </footer>
  );
}

// ─── Root Layout ───────────────────────────────────────────────────────────────
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ClerkProvider>
      <html
        lang="sv"
        /* dark class enforcar alltid mörkt tema (dark-first design) */
        className={`dark ${bebasNeue.variable} ${dmSans.variable}`}
        suppressHydrationWarning
      >
        <body className="min-h-dvh flex flex-col">
          <SiteHeader />
          <main className="flex-1">{children}</main>
          <SiteFooter />
          <Toaster position="bottom-right" theme="dark" richColors />
        </body>
      </html>
    </ClerkProvider>
  );
}
