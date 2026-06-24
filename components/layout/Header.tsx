"use client";

import Link from "next/link";
import { NavAuth } from "@/components/ui/NavAuth";
import { ThemeToggle } from "@/components/ui/ThemeToggle";

export function Header({ clerkEnabled }: { clerkEnabled: boolean }) {
  return (
    <header className="sticky top-0 z-50 border-b border-border/40 bg-background/90 backdrop-blur-xl">
      <div className="w-full px-5 sm:px-6 h-12 flex items-center justify-between gap-4">
        <Link
          href="/"
          aria-label="Athopia startsida"
          className="font-heading text-xl text-foreground hover:text-pitch transition-colors duration-150"
        >
          ATHOPIA
        </Link>

        <div className="flex items-center gap-1.5">
          <ThemeToggle />
          <NavAuth clerkEnabled={clerkEnabled} />
        </div>
      </div>
    </header>
  );
}
