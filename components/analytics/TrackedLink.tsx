"use client";

import Link, { type LinkProps } from "next/link";
import type { AnchorHTMLAttributes } from "react";

/** Link som skickar ett produkt-event via befintligt /api/analytics/event-lager innan navigering. */
export function TrackedLink({
  event,
  props,
  children,
  ...rest
}: LinkProps &
  AnchorHTMLAttributes<HTMLAnchorElement> & {
    event: string;
    props?: Record<string, string | number | boolean | null>;
  }) {
  return (
    <Link
      {...rest}
      onClick={(e) => {
        void fetch("/api/analytics/event", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ event, props }),
        }).catch(() => {});
        rest.onClick?.(e);
      }}
    >
      {children}
    </Link>
  );
}
