"use client";

import { useEffect, useMemo, useState } from "react";
import { motion, useReducedMotion } from "motion/react";
import Link from "next/link";
import { MoveRight, Sparkles } from "lucide-react";

interface AnimatedHeroProps {
  /** Statisk inledning av rubriken */
  lead?: string;
  /** Roterande avslut på rubriken */
  titles?: string[];
  description?: string;
  primary?: { label: string; href: string };
  secondary?: { label: string; href: string };
  badge?: { label: string; href: string };
}

export function AnimatedHero({
  lead = "Fotboll som",
  titles = ["känns på riktigt.", "gör dig smartare.", "går på djupet.", "berättas rätt."],
  description = "Athopia är plattformen för dig som vill mer än en tabell och tre rader fakta. Djupanalys. Matchkänsla. Allsvenskan — läst som det förtjänar.",
  primary = { label: "Skapa konto", href: "/sign-up" },
  secondary = { label: "Logga in", href: "/sign-in" },
  badge = { label: "Läs dagens analys", href: "/analys" },
}: AnimatedHeroProps) {
  const [titleNumber, setTitleNumber] = useState(0);
  const reducedMotion = useReducedMotion();
  const titleList = useMemo(() => titles, [titles]);

  useEffect(() => {
    if (reducedMotion) return;
    const timeoutId = setTimeout(() => {
      setTitleNumber((n) => (n === titleList.length - 1 ? 0 : n + 1));
    }, 2400);
    return () => clearTimeout(timeoutId);
  }, [titleNumber, titleList, reducedMotion]);

  return (
    <div className="w-full">
      <div className="max-w-[1200px] mx-auto px-6 md:px-16">
        <div className="flex gap-8 pt-32 pb-16 lg:pt-44 lg:pb-24 items-center justify-center flex-col">
          <div>
            <Link
              href={badge.href}
              className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/[0.04] px-4 py-2 text-sm text-white/70 hover:text-white hover:border-white/30 transition-all duration-200"
            >
              <Sparkles className="w-3.5 h-3.5 text-pitch" />
              {badge.label} <MoveRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="flex gap-4 flex-col w-full">
            <h1
              className="font-heading max-w-6xl w-full text-center mx-auto px-2"
              style={{ fontSize: "clamp(2.5rem, 1.3rem + 5vw, 6.5rem)", lineHeight: 1.08, letterSpacing: "-0.015em" }}
            >
              <span className="text-white">{lead}</span>
              <span className="relative flex w-full justify-center overflow-hidden text-center md:pb-3 md:pt-1 h-[1.25em]">
                &nbsp;
                {titleList.map((title, index) => (
                  <motion.span
                    key={index}
                    className="absolute italic text-pitch whitespace-nowrap px-1"
                    initial={{ opacity: 0, y: reducedMotion ? 0 : -100 }}
                    transition={{ type: "spring", stiffness: 50 }}
                    animate={
                      titleNumber === index
                        ? { y: 0, opacity: 1 }
                        : { y: reducedMotion ? 0 : titleNumber > index ? -150 : 150, opacity: 0 }
                    }
                  >
                    {title}
                  </motion.span>
                ))}
              </span>
            </h1>

            <p className="text-body-fluid text-white/60 max-w-2xl text-center mx-auto">
              {description}
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto px-2 sm:px-0">
            <Link
              href={secondary.href}
              className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border border-white/20 px-8 py-3.5 text-base font-sans text-white hover:border-white/45 hover:scale-[1.02] active:scale-[0.98] transition-all duration-200"
            >
              {secondary.label}
            </Link>
            <Link
              href={primary.href}
              className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-pitch px-8 py-3.5 text-base font-sans font-bold text-black hover:scale-[1.02] active:scale-[0.98] transition-transform duration-200"
            >
              {primary.label} <MoveRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
