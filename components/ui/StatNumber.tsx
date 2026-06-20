"use client";

import NumberFlow, { type Format } from "@number-flow/react";
import { cn } from "@/lib/utils";

interface StatNumberProps {
  value: number;
  /** Intl.NumberFormat-options, t.ex. { style: "percent" } */
  format?: Format;
  /** Text efter siffran, t.ex. "poäng" */
  suffix?: string;
  /** Text före siffran, t.ex. "+" */
  prefix?: string;
  className?: string;
}

/**
 * Animerad siffra (NumberFlow) för statistik — ticker-känsla när
 * värdet uppdateras (live-resultat, tabellpoäng, matchstatistik).
 */
export function StatNumber({
  value,
  format,
  suffix,
  prefix,
  className,
}: StatNumberProps) {
  return (
    <NumberFlow
      value={value}
      format={format}
      prefix={prefix}
      suffix={suffix ? ` ${suffix}` : undefined}
      locales="sv-SE"
      className={cn("font-semibold tabular-nums", className)}
    />
  );
}
