"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { cn } from "@/lib/utils";

interface LargeTitleHeaderProps {
  title: string;
  subtitle?: string;
  /** Actions till höger i den kompakta raden (ikoner, knappar) */
  actions?: ReactNode;
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
  className,
}: LargeTitleHeaderProps) {
  const sentinelRef = useRef<HTMLDivElement>(null);
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => setCollapsed(!entry.isIntersecting),
      { rootMargin: "-56px 0px 0px 0px" }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <header className={cn("w-full", className)}>
      {/* Kompakt sticky rad */}
      <div
        className={cn(
          "sticky top-0 z-40 flex h-14 items-center justify-between border-b px-4 backdrop-blur-xl transition-colors duration-300",
          collapsed
            ? "border-border bg-background/80"
            : "border-transparent bg-transparent"
        )}
      >
        <span
          className={cn(
            "text-[17px] font-semibold transition-opacity duration-200",
            collapsed ? "opacity-100" : "opacity-0"
          )}
          aria-hidden={!collapsed}
        >
          {title}
        </span>
        {actions && <div className="flex items-center gap-2">{actions}</div>}
      </div>

      {/* Stor titel som scrollar med */}
      <div ref={sentinelRef} className="px-4 pb-3 pt-1">
        <h1 className="text-[34px] font-bold tracking-tight">{title}</h1>
        {subtitle && (
          <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>
        )}
      </div>
    </header>
  );
}
