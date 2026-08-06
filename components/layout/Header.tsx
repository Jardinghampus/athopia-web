"use client";

import Link from "next/link";
import { Menu, Search } from "lucide-react";
import { openSearchPalette, SEARCH_HREF } from "@/hooks/useCommandPalette";
import { NavAuth } from "@/components/ui/NavAuth";
import { ThemeToggle } from "@/components/ui/ThemeToggle";

function openSearch(e: React.MouseEvent) {
  // Direkt mot den delade storen: ett window-event når bara lyssnare som redan
  // hunnit monteras, och tappade klick i glappet mellan hydreringar.
  // Modifierade klick lämnas åt webbläsaren (öppna i ny flik).
  if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return;
  e.preventDefault();
  openSearchPalette();
}

export function Header({ clerkEnabled }: { clerkEnabled: boolean }) {
  return (
    <header className="sticky top-0 z-50 border-b border-border/40 bg-background/90 backdrop-blur-xl">
      <div className="w-full px-3 sm:px-6 h-12 flex items-center justify-between gap-2 sm:gap-4">
        <div className="flex min-w-0 items-center gap-1">
          {/* Hamburger — mobile only, opens MobileNav drawer */}
          <button
            aria-label="Öppna meny"
            onClick={() => window.dispatchEvent(new CustomEvent("athopia:open-mobile-menu"))}
            className="md:hidden -ml-2.5 size-11 flex items-center justify-center rounded-full hover:bg-card transition-colors text-muted-foreground
              focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pitch focus-visible:ring-offset-2 focus-visible:ring-offset-background"
          >
            <Menu className="w-5 h-5" />
          </button>
          <Link
            href="/"
            aria-label="Athopia startsida"
            className="inline-flex h-11 shrink-0 items-center rounded-md font-heading text-lg sm:text-xl text-foreground hover:text-pitch-ink transition-colors duration-150
              focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pitch focus-visible:ring-offset-2 focus-visible:ring-offset-background"
          >
            ATHOPIA
          </Link>
        </div>

        <div className="flex shrink-0 items-center gap-1.5">
          {/* Riktig länk, inte knapp: ett klick före hydrering navigerar till
              ?sok=1 och dialogen öppnas av URL:en. Efter hydrering tar onClick
              över och öppnar utan navigering. */}
          <a
            href={SEARCH_HREF}
            onClick={openSearch}
            aria-label="Sök"
            title="Sök (⌘K)"
            className="flex size-11 items-center justify-center rounded-full hover:bg-card transition-colors text-muted-foreground
              focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pitch focus-visible:ring-offset-2 focus-visible:ring-offset-background"
          >
            <Search className="w-[18px] h-[18px]" />
          </a>
          {/* Temaväxlaren finns redan i mobilmenyn ("Utseende") — att bära den
              även i headern dubblerar kontrollen och spräcker raden på 320px. */}
          <span className="hidden md:inline-flex">
            <ThemeToggle />
          </span>
          <NavAuth clerkEnabled={clerkEnabled} />
        </div>
      </div>
    </header>
  );
}
