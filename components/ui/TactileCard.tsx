"use client";

import { forwardRef, type ComponentPropsWithoutRef, type ReactNode } from "react";
import { motion } from "motion/react";
import { cn } from "@/lib/utils";
import { transitions, pressScale } from "@/lib/motion";

/**
 * Tactile yt-kort: material-yta (svag vit ton + hairline) med rounded-2xl
 * enligt DESIGN.md. Med onClick blir kortet tryckbart med tap-scale.
 * Filen heter TactileCard.tsx eftersom shadcn:s card.tsx redan finns
 * (Windows är case-okänsligt) — men exporten heter Card.
 */

const surface =
  "rounded-2xl border border-border bg-card dark:bg-white/[0.025] text-card-foreground";

interface CardProps extends ComponentPropsWithoutRef<"div"> {
  children: ReactNode;
  /** Gör kortet tryckbart med tap-scale-feedback */
  onPress?: () => void;
}

export const Card = forwardRef<HTMLDivElement, CardProps>(function Card(
  { className, children, onPress, ...props },
  ref
) {
  if (onPress) {
    return (
      <motion.div
        ref={ref}
        role="button"
        tabIndex={0}
        onClick={onPress}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            onPress();
          }
        }}
        whileTap={{ scale: pressScale }}
        transition={transitions.press}
        className={cn(
          surface,
          "cursor-pointer select-none touch-manipulation outline-none focus-visible:ring-2 focus-visible:ring-ring",
          className
        )}
      >
        {children}
      </motion.div>
    );
  }
  return (
    <div ref={ref} className={cn(surface, className)} {...props}>
      {children}
    </div>
  );
});
