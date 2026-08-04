"use client";

import Link from "next/link";
import { Menu, Search } from "lucide-react";
import { NavAuth } from "@/components/ui/NavAuth";
import { ThemeToggle } from "@/components/ui/ThemeToggle";

function openSearch() {
  window.dispatchEvent(new CustomEvent("athopia:open-search"));
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
          <button
            type="button"
            onClick={openSearch}
            aria-label="Sök"
            title="Sök (⌘K)"
            className="flex size-11 items-center justify-center rounded-full hover:bg-card transition-colors text-muted-foreground
              focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pitch focus-visible:ring-offset-2 focus-visible:ring-offset-background"
          >
            <Search className="w-[18px] h-[18px]" />
          </button>
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
