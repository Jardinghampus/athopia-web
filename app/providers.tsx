"use client";

import { type ReactNode } from "react";
import { MotionConfig } from "motion/react";

export function Providers({ children }: { children: ReactNode }) {
  return (
    // reducedMotion="user": alla motion-komponenter stänger av transform-
    // animationer när prefers-reduced-motion är satt (opacity behålls).
    <MotionConfig reducedMotion="user">{children}</MotionConfig>
  );
}
