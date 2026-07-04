"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Search, User } from "lucide-react";
import { useCommandPalette } from "@/hooks/useCommandPalette";
import { NAV_ITEMS } from "@/lib/nav";
import "./GlassNav.css";

export function GlassNav({ clerkEnabled: _clerkEnabled }: { clerkEnabled?: boolean }) {
  const pathname = usePathname();
  const { openPalette } = useCommandPalette();

  // On thread pages the compose bar owns the bottom — hide GlassNav
  const hideOnThread = /^\/forum\/.+\/.+/.test(pathname);

  const activeIndex = NAV_ITEMS.findIndex(
    ({ href }) => pathname === href || pathname.startsWith(href + "/")
  );

  function openTeamSelect() {
    window.dispatchEvent(new CustomEvent("athopia:open-team-select"));
  }

  return (
    <div
      aria-hidden={hideOnThread}
      className={[
        "pointer-events-none fixed inset-x-0 z-50 flex justify-center",
        "bottom-[calc(env(safe-area-inset-bottom)+1rem)]",
        "transition-opacity duration-200",
        hideOnThread ? "opacity-0 pointer-events-none" : "opacity-100",
      ].join(" ")}
    >
      <nav
        className="glassnav pointer-events-auto"
        aria-label="Huvudnavigation"
        style={{ ["--active" as string]: Math.max(activeIndex, 0) }}
      >
        {/* Sliding glass thumb — only visible for NAV_ITEMS */}
        <span
          className="glassnav__thumb"
          aria-hidden
          style={{ opacity: activeIndex === -1 ? 0 : 1 }}
        />

        {/* Nav links */}
        {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || pathname.startsWith(href + "/");
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

        {/* Action: Välj lag */}
        <button
          type="button"
          onClick={openTeamSelect}
          title="Välj lag"
          aria-label="Välj lag"
          className="glassnav__item"
        >
          <User strokeWidth={2} />
        </button>

        {/* Action: Sök */}
        <button
          type="button"
          onClick={openPalette}
          title="Sök"
          aria-label="Sök"
          className="glassnav__item"
        >
          <Search strokeWidth={2} />
        </button>
      </nav>
    </div>
  );
}
