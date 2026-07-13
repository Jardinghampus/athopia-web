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
      <div className="w-full px-5 sm:px-6 h-12 flex items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          {/* Hamburger — mobile only, opens MobileNav drawer */}
          <button
            aria-label="Öppna meny"
            onClick={() => window.dispatchEvent(new CustomEvent("athopia:open-mobile-menu"))}
            className="md:hidden w-8 h-8 flex items-center justify-center rounded-full hover:bg-card transition-colors text-muted-foreground"
          >
            <Menu className="w-5 h-5" />
          </button>
          <Link
            href="/"
            aria-label="Athopia startsida"
            className="font-heading text-xl text-foreground hover:text-pitch transition-colors duration-150"
          >
            ATHOPIA
          </Link>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={openSearch}
            aria-label="Sök"
            title="Sök (⌘K)"
            className="hidden md:flex w-8 h-8 items-center justify-center rounded-full hover:bg-card transition-colors text-muted-foreground"
          >
            <Search className="w-[18px] h-[18px]" />
          </button>
          <ThemeToggle />
          <NavAuth clerkEnabled={clerkEnabled} />
        </div>
      </div>
    </header>
  );
}
