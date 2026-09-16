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

  /* Dämpkvoterna nedan är kritiskt dämpade (zeta = 1,0): damping = 2*sqrt(k*m).
     Apples regel är att översläng bara hör hemma när gesten SJÄLV bar momentum
     — en snärt, ett kast, ett släpp. Ett knapptryck och en flikindikator gör
     inte det, så de ska landa utan studs. Tidigare låg press på zeta 0,87 och
     snappy på 0,80, alltså studs där ingen gest fanns.

     Sheeten i BottomSheet.tsx är det avsiktliga undantaget: den dras och
     släpps, alltså zeta ~0,8. */

  /** Tryckrespons — snabb och stum, som iOS */
  press: {
    type: "spring",
    stiffness: 500,
    damping: 34.6, // 2*sqrt(500*0.6)
    mass: 0.6,
  } satisfies Transition,

  /** Layoutskiften — segmented control-indikator, tab-markör */
  snappy: {
    type: "spring",
    stiffness: 400,
    damping: 40, // 2*sqrt(400)
  } satisfies Transition,

  /** Mjuk spring — pull-to-refresh, större element */
  gentle: {
    type: "spring",
    stiffness: 200,
    damping: 28.3, // 2*sqrt(200)
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

/** Skala vid nedtryck — Pressable-primitiven (ännu inte inkopplad på några ytor). */
export const pressScale = 0.97;
