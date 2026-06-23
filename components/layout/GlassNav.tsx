"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Star, Newspaper, BarChart3, MessageSquare, User } from "lucide-react";
import "./GlassNav.css";

const ITEMS = [
  { href: "/mitt-lag", label: "Mitt lag", icon: Star },
  { href: "/nyheter", label: "Nyheter", icon: Newspaper },
  { href: "/statistik", label: "Statistik", icon: BarChart3 },
  { href: "/forum", label: "Forum", icon: MessageSquare },
  { href: "/konto", label: "Profil", icon: User },
] as const;

/**
 * Floating glass tab bar — replaces the old top/bottom navs.
 * - Desktop (md+): centered near the top, a touch below the edge.
 * - Mobile: pinned to the bottom (safe-area aware), icons only.
 * Active route is highlighted by the sliding glass thumb.
 */
export function GlassNav() {
  const pathname = usePathname();

  const activeIndex = ITEMS.findIndex(
    ({ href }) => pathname === href || pathname.startsWith(href + "/")
  );

  return (
    <div
      className="
        pointer-events-none fixed inset-x-0 z-50 flex justify-center
        top-auto bottom-[calc(env(safe-area-inset-bottom)+1rem)]
        md:bottom-auto md:top-3
      "
    >
      <nav
        className="glassnav pointer-events-auto"
        aria-label="Huvudnavigation"
        style={{ ["--active" as string]: Math.max(activeIndex, 0) }}
      >
        <span
          className="glassnav__thumb"
          aria-hidden
          style={{ opacity: activeIndex === -1 ? 0 : 1 }}
        />

        {ITEMS.map(({ href, label, icon: Icon }) => {
          const active =
            pathname === href || pathname.startsWith(href + "/");
          return (
            <Link
              key={href}
              href={href}
              title={label}
              aria-label={label}
              aria-current={active ? "page" : undefined}
              data-active={active}
              className="glassnav__item"
            >
              <Icon strokeWidth={2} />
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
