"use client";

import Link from "next/link";
import { Search, Menu, X } from "lucide-react";
import { useState } from "react";
import { NavAuth } from "@/components/ui/NavAuth";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { useCommandPalette } from "@/hooks/useCommandPalette";

const NAV_LINKS = [
  { href: "/app/nyheter", label: "Nyheter" },
  { href: "/app/allsvenskan", label: "Allsvenskan" },
  { href: "/app/podcast", label: "Podcasts" },
  { href: "/app/statistik", label: "Statistik" },
  { href: "/app/analys", label: "Analys" },
];

export function Header({ clerkEnabled }: { clerkEnabled: boolean }) {
  const { openPalette } = useCommandPalette();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <>
      <header className="sticky top-0 z-50 border-b border-border/50 bg-background/90 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between gap-4">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <Link
              href="/"
              aria-label="Athopia startsida"
              className="font-heading text-2xl text-foreground hover:text-pitch transition-colors duration-150"
            >
              ATHOPIA
            </Link>
          </div>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-5 text-sm text-muted-foreground">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="hover:text-foreground transition-colors duration-150"
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {/* Actions */}
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              aria-label="Sök (Cmd+K)"
              title="Sök (Cmd+K)"
              onClick={openPalette}
              className="active:scale-[0.93] transition-transform duration-[120ms] [transition-timing-function:cubic-bezier(0.23,1,0.32,1)]"
            >
              <Search className="w-4 h-4" />
            </Button>

            <ThemeToggle />

            <div className="hidden sm:block">
              <NavAuth clerkEnabled={clerkEnabled} />
            </div>

            {/* Mobile menu button */}
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden active:scale-[0.93] transition-transform duration-[120ms] [transition-timing-function:cubic-bezier(0.23,1,0.32,1)]"
              aria-label={mobileOpen ? "Stäng meny" : "Öppna meny"}
              onClick={() => setMobileOpen((v) => !v)}
            >
              {mobileOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
            </Button>
          </div>
        </div>

        {/* Mobile nav */}
        {mobileOpen && (
          <div className="md:hidden border-t border-border/50 bg-background/98 backdrop-blur-xl">
            <nav className="flex flex-col max-w-7xl mx-auto px-4 py-3 gap-1">
              {NAV_LINKS.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="px-3 py-2.5 text-sm text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-colors duration-150"
                  onClick={() => setMobileOpen(false)}
                >
                  {link.label}
                </Link>
              ))}
              <div className="pt-2 px-3">
                <NavAuth clerkEnabled={clerkEnabled} />
              </div>
            </nav>
          </div>
        )}
      </header>
    </>
  );
}
