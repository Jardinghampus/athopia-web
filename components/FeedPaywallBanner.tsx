"use client";

import Link from "next/link";
import { Sparkles, Zap, BellRing } from "lucide-react";
import { motion } from "motion/react";

const PERKS = [
  { icon: Zap, label: "Obegränsat flöde — aldrig gated" },
  { icon: Sparkles, label: "AI-sammanfattningar per match" },
  { icon: BellRing, label: "Push-alerts för ditt lag" },
];

export function FeedPaywallBanner() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.38, ease: [0.23, 1, 0.32, 1] }}
      className="relative overflow-hidden rounded-2xl border border-pitch/30 bg-gradient-to-br from-pitch/12 via-pitch/6 to-transparent p-5"
    >
      {/* Glow */}
      <div
        aria-hidden
        className="pointer-events-none absolute -top-8 -right-8 w-40 h-40 rounded-full bg-pitch/20 blur-3xl"
      />

      <div className="relative z-10">
        {/* Badge */}
        <div className="inline-flex items-center gap-1.5 rounded-full border border-pitch/40 bg-pitch/15 px-2.5 py-1 mb-3">
          <Sparkles className="w-3 h-3 text-pitch" />
          <span className="text-[11px] font-semibold text-pitch uppercase tracking-wide">Athopia PRO</span>
        </div>

        <h3 className="text-base font-bold text-foreground leading-snug mb-1">
          Du ser gratis-versionen
        </h3>
        <p className="text-sm text-muted-foreground mb-4">
          Uppgradera för obegränsat flöde, AI-analys och mer.
        </p>

        {/* Perks */}
        <ul className="space-y-2 mb-5">
          {PERKS.map(({ icon: Icon, label }) => (
            <li key={label} className="flex items-center gap-2.5">
              <div className="w-5 h-5 rounded-full bg-pitch/20 flex items-center justify-center shrink-0">
                <Icon className="w-3 h-3 text-pitch" />
              </div>
              <span className="text-xs text-foreground/80">{label}</span>
            </li>
          ))}
        </ul>

        {/* CTAs */}
        <div className="flex gap-2">
          <Link
            href="/prenumerera"
            className="flex-1 h-10 rounded-xl pitch-gradient text-white text-sm font-semibold flex items-center justify-center transition-opacity hover:opacity-90 active:opacity-80 touch-manipulation"
          >
            Uppgradera — 89 kr/mån
          </Link>
          <Link
            href="/prenumerera"
            className="px-4 h-10 rounded-xl border border-border text-muted-foreground text-sm flex items-center justify-center hover:border-pitch/40 hover:text-foreground transition-colors touch-manipulation"
          >
            Se planer
          </Link>
        </div>

        <p className="text-[11px] text-muted-foreground/60 text-center mt-3">
          Avsluta när som helst · Ingen bindningstid
        </p>
      </div>
    </motion.div>
  );
}

/** Ghost cards shown below the paywall banner to hint at more content */
export function FeedGhostCards({ count = 3 }: { count?: number }) {
  return (
    <div className="relative pointer-events-none select-none" aria-hidden>
      <div className="flex flex-col gap-3">
        {Array.from({ length: count }).map((_, i) => (
          <div
            key={i}
            className="h-20 rounded-xl bg-card border border-border opacity-40"
            style={{ filter: `blur(${i * 1.5 + 1}px)`, opacity: 0.4 - i * 0.1 }}
          />
        ))}
      </div>
      {/* Gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-background/60 to-background" />
    </div>
  );
}
