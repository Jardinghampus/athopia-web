"use client";

import { useState, type ReactNode } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface CollapsibleSectionProps {
  title: string;
  /** Extra content in the header row (e.g. "Alla resultat →") */
  trailing?: ReactNode;
  defaultOpen?: boolean;
  className?: string;
  children: ReactNode;
  /** Optional leading icon/node before the title (e.g. live dot) */
  leading?: ReactNode;
}

export function CollapsibleSection({
  title,
  trailing,
  defaultOpen = true,
  className,
  children,
  leading,
}: CollapsibleSectionProps) {
  const [open, setOpen] = useState(defaultOpen);
  const panelId = `section-${title.toLowerCase().replace(/\s+/g, "-")}`;

  return (
    <section className={cn(className)}>
      <div className="mb-3 flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          aria-controls={panelId}
          className="group flex min-w-0 flex-1 items-center gap-2 text-left touch-manipulation"
        >
          {leading}
          <h2 className="font-semibold text-xl text-foreground truncate">{title}</h2>
          <ChevronDown
            className={cn(
              "h-5 w-5 shrink-0 text-muted-foreground transition-transform duration-200",
              open ? "rotate-0" : "-rotate-90",
            )}
            aria-hidden
          />
          <span className="sr-only">{open ? "Fäll ihop" : "Expandera"}</span>
        </button>
        {trailing}
      </div>
      <div
        id={panelId}
        hidden={!open}
        className={open ? undefined : "hidden"}
      >
        {children}
      </div>
    </section>
  );
}
