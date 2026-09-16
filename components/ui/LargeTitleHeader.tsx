"use client";

import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";
import { cn } from "@/lib/utils";

interface LargeTitleHeaderProps {
  title: string;
  subtitle?: ReactNode;
  /** Actions till höger i den kompakta raden (ikoner, knappar) */
  actions?: ReactNode;
  /** Ersätter den stora h1:an (t.ex. en lagväljare) — compact-raden visar fortfarande `title` */
  titleContent?: ReactNode;
  /** Px från viewport-toppen där compact-raden fastnar (48 under global h-12-header, plus TeamNav) */
  stickyOffset?: number;
  className?: string;
}

/**
 * iOS-stil large title: stor rubrik som scrollar med innehållet,
 * och en sticky kompakt rad vars titel tonas in när den stora
 * rubriken scrollat förbi.
 */
export function LargeTitleHeader({
  title,
  subtitle,
  actions,
  titleContent,
  stickyOffset = 0,
  className,
}: LargeTitleHeaderProps) {
  const sentinelRef = useRef<HTMLDivElement>(null);
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => setCollapsed(!entry.isIntersecting),
      { rootMargin: `-${stickyOffset + 56}px 0px 0px 0px` }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [stickyOffset]);

  return (
    <header className={cn("w-full", className)}>
      {/* Kompakt sticky rad. Inte collapsed: -mb-14 så den inte lämnar
          en tom 56px-remsa mellan flikraden och lagnamnet. */}
      <div
        style={{ top: stickyOffset } as CSSProperties}
        className={cn(
          "translucent-chrome sticky z-40 flex h-14 items-center justify-between border-b px-4 backdrop-blur-xl transition-colors duration-300",
          collapsed
            ? "border-border bg-background/80"
            : "pointer-events-none -mb-14 border-transparent bg-transparent",
        )}
      >
        <span
          className={cn(
            "truncate text-[17px] font-semibold transition-opacity duration-200",
            collapsed ? "opacity-100" : "opacity-0"
          )}
          aria-hidden={!collapsed}
        >
          {title}
        </span>
        {actions && (
          <div
            className={cn(
              "flex shrink-0 items-center gap-2",
              collapsed ? "pointer-events-auto" : "pointer-events-none opacity-0",
            )}
          >
            {actions}
          </div>
        )}
      </div>

      {/* Stor titel som scrollar med */}
      <div ref={sentinelRef} className="flex items-start justify-between gap-3 px-4 pb-3 pt-1">
        <div className="min-w-0 flex-1">
          {titleContent ? (
            // Sidan måste ha exakt en h1 även när titeln ersätts av en väljare —
            // annars saknar lagsidorna rubrik för skärmläsare och sökmotorer.
            <>
              <h1 className="sr-only">{title}</h1>
              {titleContent}
            </>
          ) : (
            <h1 className="text-[34px] font-bold tracking-tight text-balance">{title}</h1>
          )}
          {subtitle && (
            <div className="mt-1 text-sm text-muted-foreground">{subtitle}</div>
          )}
        </div>
        {actions ? (
          <div className="flex shrink-0 items-center gap-2 pt-1">{actions}</div>
        ) : null}
      </div>
    </header>
  );
}
