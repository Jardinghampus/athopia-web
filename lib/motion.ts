/**
 * Delade motion-tokens för native-feel.
 * Speglar easing-tokens i globals.css (@theme) så CSS och JS animerar identiskt.
 */
import type { Transition, Variants } from "motion/react";

// ── Easing (samma kurvor som --ease-* i globals.css) ───────────────────────
export const easeOutSmooth = [0.23, 1, 0.32, 1] as const;
export const easeInOutSmooth = [0.77, 0, 0.175, 1] as const;
export const easeDrawer = [0.32, 0.72, 0, 1] as const;

// ── Durations (sekunder) ────────────────────────────────────────────────────
export const duration = {
  instant: 0.1,
  fast: 0.2,
  base: 0.3,
  slow: 0.5,
} as const;

// ── Transitions ─────────────────────────────────────────────────────────────
export const transitions = {
  /** Standard UI-övergång — paneler, fade/slide */
  smooth: {
    duration: duration.base,
    ease: easeOutSmooth,
  } satisfies Transition,

  /** Drawers/sheets — Emil Kowalski-kurvan vaul använder */
  drawer: {
    duration: duration.slow,
    ease: easeDrawer,
  } satisfies Transition,

  /** Tryckrespons — snabb och stum, som iOS */
  press: {
    type: "spring",
    stiffness: 500,
    damping: 30,
    mass: 0.6,
  } satisfies Transition,

  /** Layoutskiften — segmented control-indikator, tab-markör */
  snappy: {
    type: "spring",
    stiffness: 400,
    damping: 32,
  } satisfies Transition,

  /** Mjuk spring — pull-to-refresh, större element */
  gentle: {
    type: "spring",
    stiffness: 200,
    damping: 26,
  } satisfies Transition,
} as const;

// ── Gemensamma variants ─────────────────────────────────────────────────────
export const fadeInUp: Variants = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0, transition: transitions.smooth },
};

export const fadeIn: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: transitions.smooth },
};

export const scaleIn: Variants = {
  hidden: { opacity: 0, scale: 0.96 },
  visible: { opacity: 1, scale: 1, transition: transitions.smooth },
};

export const staggerChildren: Variants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.06 } },
};

/** Skala vid nedtryck — används av Pressable m.fl. */
export const pressScale = 0.97;
