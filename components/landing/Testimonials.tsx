"use client";

import { useRef } from "react";
import { motion, useScroll, useTransform, useReducedMotion } from "motion/react";
import { Container, Label, Display, Reveal, Section } from "./primitives";

const TESTIMONIALS = [
  {
    quote:
      "Jag förstår Allsvenskan på ett helt annat sätt nu. Det är som att äntligen ha glasögon på.",
    name: "Marcus L.",
    meta: "Djurgårdsfan sedan 1994",
    initials: "ML",
    accent: "#1D9E75",
    bg: "from-[#0d2b22] to-[#0A0A0A]",
  },
  {
    quote:
      "Äntligen en plats där de inte skriver ner till mig. De förutsätter att jag kan fotboll. Det stämmer.",
    name: "Sara K.",
    meta: "Hammarbysupporter",
    initials: "SK",
    accent: "#38bdf8",
    bg: "from-[#0c1f2b] to-[#0A0A0A]",
  },
  {
    quote:
      "Matchrapporterna läser jag alltid på måndag morgon. Bättre start på veckan finns inte.",
    name: "Johan A.",
    meta: "AIK-fan, Göteborg",
    initials: "JA",
    accent: "#a78bfa",
    bg: "from-[#1a0d2b] to-[#0A0A0A]",
  },
];

function StickyCard({
  i,
  quote,
  name,
  meta,
  initials,
  accent,
  bg,
  progress,
  total,
}: (typeof TESTIMONIALS)[0] & {
  i: number;
  progress: ReturnType<typeof useScroll>["scrollYProgress"];
  total: number;
}) {
  const rangeStart = i / total;
  const rangeEnd = Math.min((i + 1) / total, 1);
  const scale = useTransform(progress, [rangeStart, rangeEnd], [1, 0.93]);
  const opacity = useTransform(progress, [rangeStart, rangeEnd], [1, i === total - 1 ? 1 : 0.5]);

  return (
    <div
      className="sticky flex items-center justify-center"
      style={{ top: `${80 + i * 24}px` }}
    >
      <motion.figure
        style={{ scale, opacity, transformOrigin: "top center" }}
        className={`w-full max-w-2xl rounded-3xl border border-white/[0.07] bg-gradient-to-b ${bg} p-8 shadow-2xl md:p-10`}
      >
        {/* Glöd */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 rounded-3xl opacity-20"
          style={{
            background: `radial-gradient(ellipse 60% 40% at 50% 0%, ${accent}33, transparent)`,
          }}
        />

        <span
          aria-hidden
          className="font-heading text-6xl leading-none"
          style={{ color: accent }}
        >
          &ldquo;
        </span>

        <blockquote className="relative mt-2 text-xl leading-relaxed text-white/85 md:text-2xl">
          {quote}
        </blockquote>

        <figcaption className="mt-8 flex items-center gap-4 border-t border-white/[0.07] pt-6">
          <div
            className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-full text-sm font-bold text-white"
            style={{ background: accent + "33", border: `1.5px solid ${accent}55` }}
          >
            <span style={{ color: accent }}>{initials}</span>
          </div>
          <div>
            <div className="text-sm font-semibold text-white">{name}</div>
            <div className="mt-0.5 text-xs text-white/35">{meta}</div>
          </div>
        </figcaption>
      </motion.figure>
    </div>
  );
}

export function Testimonials() {
  const container = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();
  const { scrollYProgress } = useScroll({
    target: container,
    offset: ["start start", "end end"],
  });

  return (
    <Section>
      <Container>
        <div className="mb-12 text-center md:mb-16">
          <Reveal>
            <Label>Läsarna säger</Label>
          </Reveal>
          <Reveal delay={0.08}>
            <Display size="lg" className="mt-4">
              De som läser
              <br />
              slutar inte läsa.
            </Display>
          </Reveal>
        </div>

        {/* Mobile: enkel grid */}
        <div className="grid grid-cols-1 gap-4 md:hidden">
          {TESTIMONIALS.map(({ quote, name, meta, initials, accent, bg }) => (
            <figure
              key={name}
              className={`rounded-3xl border border-white/[0.07] bg-gradient-to-b ${bg} p-6`}
            >
              <span className="font-heading text-4xl leading-none" style={{ color: accent }}>
                &ldquo;
              </span>
              <blockquote className="mt-2 text-base leading-relaxed text-white/80">
                {quote}
              </blockquote>
              <figcaption className="mt-6 flex items-center gap-3 border-t border-white/[0.07] pt-4">
                <div
                  className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full text-xs font-bold"
                  style={{ background: accent + "33", color: accent, border: `1.5px solid ${accent}55` }}
                >
                  {initials}
                </div>
                <div>
                  <div className="text-sm font-semibold text-white">{name}</div>
                  <div className="text-xs text-white/35">{meta}</div>
                </div>
              </figcaption>
            </figure>
          ))}
        </div>

        {/* Desktop: sticky stacked cards */}
        <div
          ref={container}
          className="relative hidden md:block"
          style={{ height: `${TESTIMONIALS.length * 380}px` }}
        >
          {reduced ? (
            <div className="grid grid-cols-1 gap-5">
              {TESTIMONIALS.map(({ quote, name, meta, initials, accent, bg }) => (
                <figure
                  key={name}
                  className={`rounded-3xl border border-white/[0.07] bg-gradient-to-b ${bg} p-10`}
                >
                  <span className="font-heading text-6xl leading-none" style={{ color: accent }}>
                    &ldquo;
                  </span>
                  <blockquote className="mt-2 text-xl leading-relaxed text-white/85">{quote}</blockquote>
                  <figcaption className="mt-8 flex items-center gap-4 border-t border-white/[0.07] pt-6">
                    <div
                      className="flex h-11 w-11 items-center justify-center rounded-full text-sm font-bold"
                      style={{ background: accent + "33", color: accent }}
                    >
                      {initials}
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-white">{name}</div>
                      <div className="text-xs text-white/35">{meta}</div>
                    </div>
                  </figcaption>
                </figure>
              ))}
            </div>
          ) : (
            TESTIMONIALS.map((t, i) => (
              <StickyCard
                key={t.name}
                i={i}
                total={TESTIMONIALS.length}
                {...t}
                progress={scrollYProgress}
              />
            ))
          )}
        </div>
      </Container>
    </Section>
  );
}
