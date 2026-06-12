import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface ListGroupProps {
  children: ReactNode;
  /** Rubrik ovanför gruppen, iOS-stil versal label */
  header?: string;
  /** Hjälptext under gruppen */
  footer?: string;
  className?: string;
}

/**
 * iOS-stil inset grouped list. Används tillsammans med ListRow.
 * Server component — ingen interaktivitet här.
 */
export function ListGroup({ children, header, footer, className }: ListGroupProps) {
  return (
    <section className={cn("w-full", className)}>
      {header && (
        <h3 className="mb-2 px-4 text-xs font-medium uppercase tracking-wider text-muted-foreground">
          {header}
        </h3>
      )}
      <div className="divide-y divide-border overflow-hidden rounded-2xl bg-card">
        {children}
      </div>
      {footer && (
        <p className="mt-2 px-4 text-xs text-muted-foreground">{footer}</p>
      )}
    </section>
  );
}
