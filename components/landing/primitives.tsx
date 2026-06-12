"use client";

import { useRef, type ReactNode } from "react";
import { motion, useInView, useReducedMotion } from "motion/react";

/* Delade byggstenar för landningssidan.
   Spacing följer strikt 8px-grid: sektioner py-16 (64) mobil / py-28 (112) desktop. */

export const SPRING = { type: "spring", stiffness: 320, damping: 32 } as const;
export const EASE_OUT = [0.23, 1, 0.32, 1] as const;

export function Reveal({
  children,
  delay = 0,
  className,
}: {
  children: ReactNode;
  delay?: number;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-64px" });
  const reduced = useReducedMotion();

  if (reduced) return <div className={className}>{children}</div>;

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 24 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.7, ease: EASE_OUT, delay }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

export function Container({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={`mx-auto w-full max-w-[1200px] px-5 sm:px-8 lg:px-16 ${className}`}>
      {children}
    </div>
  );
}

export function Section({
  children,
  id,
  className = "",
}: {
  children: ReactNode;
  id?: string;
  className?: string;
}) {
  return (
    <section
      id={id}
      className={`scroll-mt-20 border-t border-white/[0.06] py-16 md:py-28 ${className}`}
    >
      {children}
    </section>
  );
}

export function Label({ children }: { children: ReactNode }) {
  return (
    <span className="font-sans text-[11px] font-bold uppercase tracking-[0.18em] text-pitch">
      {children}
    </span>
  );
}

export function Display({
  children,
  size = "lg",
  className = "",
}: {
  children: ReactNode;
  size?: "xl" | "lg" | "md";
  className?: string;
}) {
  const sizes = {
    xl: "text-[clamp(3.5rem,10vw,8.5rem)]",
    lg: "text-[clamp(2.75rem,7vw,5.5rem)]",
    md: "text-[clamp(2.25rem,5.5vw,4rem)]",
  };
  return (
    <h2 className={`font-heading leading-[0.94] tracking-wide ${sizes[size]} ${className}`}>
      {children}
    </h2>
  );
}
