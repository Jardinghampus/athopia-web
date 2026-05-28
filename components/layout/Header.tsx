"use client";

import Link from "next/link";
import { Search, Menu } from "lucide-react";
import { NavAuth } from "@/components/ui/NavAuth";
import { Button } from "@/components/ui/button";

export function Header({ clerkEnabled }: { clerkEnabled: boolean }) {
  return (
    <header className="sticky top-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link href="/" className="font-heading text-2xl text-gradient" aria-label="Athopia startsida">
            ATHOPIA
          </Link>
        </div>

        <nav className="hidden md:flex items-center gap-6 text-sm text-muted-foreground">
          <Link href="/nyheter" className="hover:text-foreground transition-colors">
            Nyheter
          </Link>
          <Link href="/allsvenskan" className="hover:text-foreground transition-colors">
            Allsvenskan
          </Link>
          <Link href="/podcast" className="hover:text-foreground transition-colors">
            Podcasts
          </Link>
          <Link href="/analys" className="hover:text-foreground transition-colors">
            Analys
          </Link>
        </nav>

        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" aria-label="Sök (Cmd+K)" title="Sök (Cmd+K)">
            <Search className="w-4 h-4" />
          </Button>
          <div className="hidden sm:block">
            <NavAuth clerkEnabled={clerkEnabled} />
          </div>
          <Button variant="ghost" size="icon" className="md:hidden" aria-label="Meny">
            <Menu className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </header>
  );
}

