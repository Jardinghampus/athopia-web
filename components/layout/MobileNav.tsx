"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Star, Newspaper, BarChart3, MessageSquare, User } from "lucide-react";

const ITEMS = [
  { href: "/mitt-lag", label: "Mitt lag", icon: Star },
  { href: "/nyheter", label: "Nyheter", icon: Newspaper },
  { href: "/statistik", label: "Statistik", icon: BarChart3 },
  { href: "/forum", label: "Forum", icon: MessageSquare },
  { href: "/konto", label: "Profil", icon: User },
] as const;

export function MobileNav() {
  const pathname = usePathname();

  return (
    <nav
      className="md:hidden sticky bottom-0 z-50 border-t border-border/50 bg-background/95 backdrop-blur-md"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <div className="flex items-stretch h-14">
        {ITEMS.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || pathname.startsWith(href + "/");
          return (
            <Link
              key={href}
              href={href}
              className={`flex-1 flex flex-col items-center justify-center gap-0.5 text-[10px] font-medium transition-colors ${
                active ? "text-pitch" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Icon className="w-5 h-5" />
              {label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
