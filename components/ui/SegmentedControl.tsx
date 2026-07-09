"use client";

import { useId } from "react";
import { motion } from "motion/react";
import { cn } from "@/lib/utils";
import { transitions } from "@/lib/motion";

export interface SegmentedOption<T extends string = string> {
  value: T;
  label: string;
}

interface SegmentedControlProps<T extends string> {
  options: SegmentedOption<T>[];
  value: T;
  onChange: (value: T) => void;
  className?: string;
  "aria-label"?: string;
}

/**
 * iOS-stil segmented control med spring-animerad indikator (layoutId).
 * Mobil: kompakt typografi + horisontell scroll som säkerhetsnät så flikarna
 * inte knuffar sidan ur viewport.
 */
export function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
  className,
  "aria-label": ariaLabel,
}: SegmentedControlProps<T>) {
  const layoutId = useId();

  return (
    <div
      role="tablist"
      aria-label={ariaLabel}
      className={cn(
        "flex w-full max-w-full min-w-0 items-center gap-0.5 sm:gap-1 rounded-xl bg-muted p-1",
        "overflow-x-auto overscroll-x-contain [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden",
        className
      )}
    >
      {options.map((option) => {
        const active = option.value === value;
        return (
          <button
            key={option.value}
            role="tab"
            aria-selected={active}
            onClick={() => onChange(option.value)}
            className={cn(
              // min-h-11 = 44px touchmål på mobil; kompaktare med pekdon på sm+
              "relative min-w-0 flex-1 basis-0 rounded-lg px-1.5 sm:px-3 py-1.5 min-h-11 sm:min-h-9",
              "text-[11px] sm:text-sm font-medium leading-tight whitespace-nowrap",
              "transition-colors duration-200 select-none touch-manipulation outline-none focus-visible:ring-2 focus-visible:ring-ring",
              active ? "text-foreground" : "text-muted-foreground hover:text-foreground"
            )}
          >
            {active && (
              <motion.span
                layoutId={layoutId}
                transition={transitions.snappy}
                className="absolute inset-0 rounded-lg bg-background shadow-sm dark:bg-secondary"
              />
            )}
            <span className="relative z-10">{option.label}</span>
          </button>
        );
      })}
    </div>
  );
}
