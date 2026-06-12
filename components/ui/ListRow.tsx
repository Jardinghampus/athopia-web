"use client";

import Link from "next/link";
import { ChevronRight } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface ListRowProps {
  /** Ikon eller avatar till vänster */
  leading?: ReactNode;
  title: ReactNode;
  subtitle?: ReactNode;
  /** Värde/widget till höger (badge, switch, text) */
  trailing?: ReactNode;
  /** Visa chevron — sätts automatiskt om href anges */
  chevron?: boolean;
  href?: string;
  onClick?: () => void;
  className?: string;
}

/**
 * Rad i en ListGroup. Renderas som länk, knapp eller statisk rad
 * beroende på href/onClick. Tryckrespons via active:-state (CSS, ingen JS-spring
 * behövs för listrader — det matchar iOS bättre).
 */
export function ListRow({
  leading,
  title,
  subtitle,
  trailing,
  chevron,
  href,
  onClick,
  className,
}: ListRowProps) {
  const showChevron = chevron ?? Boolean(href);
  const interactive = Boolean(href || onClick);

  const content = (
    <>
      {leading && (
        <span className="flex size-8 shrink-0 items-center justify-center text-muted-foreground [&_svg]:size-5">
          {leading}
        </span>
      )}
      <span className="flex min-w-0 flex-1 flex-col py-0.5">
        <span className="truncate text-[15px] font-medium text-card-foreground">
          {title}
        </span>
        {subtitle && (
          <span className="truncate text-sm text-muted-foreground">{subtitle}</span>
        )}
      </span>
      {trailing && (
        <span className="shrink-0 text-sm text-muted-foreground">{trailing}</span>
      )}
      {showChevron && (
        <ChevronRight className="size-4 shrink-0 text-muted-foreground/60" aria-hidden />
      )}
    </>
  );

  const baseClass = cn(
    "flex w-full items-center gap-3 px-4 py-3 text-left select-none",
    interactive &&
      "touch-manipulation transition-colors duration-150 active:bg-muted hover:bg-muted/60 outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring",
    className
  );

  if (href) {
    return (
      <Link href={href} className={baseClass}>
        {content}
      </Link>
    );
  }
  if (onClick) {
    return (
      <button type="button" onClick={onClick} className={baseClass}>
        {content}
      </button>
    );
  }
  return <div className={baseClass}>{content}</div>;
}
