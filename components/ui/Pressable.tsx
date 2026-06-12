"use client";

import { forwardRef, type ComponentPropsWithoutRef } from "react";
import { motion } from "motion/react";
import { tv, type VariantProps } from "tailwind-variants";
import { transitions, pressScale } from "@/lib/motion";

const pressable = tv({
  base: "select-none touch-manipulation outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:opacity-50 disabled:pointer-events-none",
  variants: {
    haptic: {
      subtle: "",
      strong: "",
    },
  },
  defaultVariants: {
    haptic: "subtle",
  },
});

type PressableProps = ComponentPropsWithoutRef<typeof motion.button> &
  VariantProps<typeof pressable>;

/**
 * Tactile knapp-primitiv: skalar ned vid nedtryck med iOS-lik spring.
 * Bas för alla tryckbara ytor i native-feel-UI:t.
 */
export const Pressable = forwardRef<HTMLButtonElement, PressableProps>(
  function Pressable({ className, haptic, ...props }, ref) {
    return (
      <motion.button
        ref={ref}
        whileTap={{ scale: haptic === "strong" ? 0.94 : pressScale }}
        transition={transitions.press}
        className={pressable({ haptic, className })}
        {...props}
      />
    );
  }
);
