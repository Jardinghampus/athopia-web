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
  /** Px från viewport-toppen där compact-raden fastnar (t.ex. 56 under global h-14-header) */
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
      {/* Kompakt sticky rad */}
      <div
        style={{ top: stickyOffset } as CSSProperties}
        className={cn(
          "sticky z-40 flex h-14 items-center justify-between border-b px-4 backdrop-blur-xl transition-colors duration-300",
          collapsed
            ? "border-border bg-background/80"
            : "border-transparent bg-transparent"
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
        {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
      </div>

      {/* Stor titel som scrollar med */}
      <div ref={sentinelRef} className="px-4 pb-3 pt-1">
        {titleContent ?? (
          <h1 className="text-[34px] font-bold tracking-tight">{title}</h1>
        )}
        {subtitle && (
          <div className="mt-1 text-sm text-muted-foreground">{subtitle}</div>
        )}
      </div>
    </header>
  );
}
