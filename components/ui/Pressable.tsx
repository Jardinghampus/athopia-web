"use client";

import { forwardRef, type ComponentPropsWithoutRef } from "react";
import { motion } from "motion/react";
import { transitions, pressScale } from "@/lib/motion";

type PressableProps = ComponentPropsWithoutRef<typeof motion.button> & {
  /** Hur djupt ytan sjunker vid nedtryck. */
  press?: "subtle" | "strong";
};

/**
 * Tactile knapp-primitiv: skalar ned vid nedtryck med iOS-lik spring.
 * Bas för alla tryckbara ytor i native-feel-UI:t.
 *
 * Propen hette tidigare `haptic` och var en lögn: den utlöste ingen haptik
 * (Vibration API används ingenstans i repot), dess tailwind-variants mappade
 * till tomma strängar, och noll anropare satte den. Det enda den gjorde var
 * att ändra skalan — så den heter nu det den gör. Riktig haptik hör enligt
 * Apples regel om nytta hemma på betydelsefulla ögonblick (klart, fel, snäpp),
 * inte på varje knapptryck i appen.
 */
export const Pressable = forwardRef<HTMLButtonElement, PressableProps>(
  function Pressable({ className, press = "subtle", ...props }, ref) {
    return (
      <motion.button
        ref={ref}
        whileTap={{ scale: press === "strong" ? 0.94 : pressScale }}
        transition={transitions.press}
        className={
          "select-none touch-manipulation outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:opacity-50 disabled:pointer-events-none" +
          (className ? ` ${className}` : "")
        }
        {...props}
      />
    );
  }
);
