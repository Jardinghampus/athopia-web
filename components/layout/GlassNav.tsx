"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BOTTOM_NAV_ITEMS } from "@/lib/nav";
import "./GlassNav.css";

/**
 * Floating liquid-glass tab bar — botten-dock på alla viewports.
 * Ikoner + sliding glass thumb. Döljs på forum-tråd (compose äger bottenytan).
 */
export function GlassNav({ clerkEnabled: _clerkEnabled }: { clerkEnabled?: boolean }) {
  const pathname = usePathname();
  const hideOnThread = /^\/forum\/.+\/.+/.test(pathname);

  if (hideOnThread) return null;

  const activeIndex = BOTTOM_NAV_ITEMS.findIndex(
    ({ href }) => pathname === href || pathname.startsWith(`${href}/`),
  );

  return (
    <div className="pointer-events-none fixed inset-x-0 z-50 flex justify-center bottom-[calc(env(safe-area-inset-bottom)+1rem)]">
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

        {BOTTOM_NAV_ITEMS.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || pathname.startsWith(`${href}/`);
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
