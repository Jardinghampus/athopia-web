"use client";

import { useRef } from "react";
import Link from "next/link";
import { ArrowRight, ChevronDown } from "lucide-react";
import { motion, useScroll, useTransform, useReducedMotion } from "motion/react";
import { Container, Label, Reveal } from "./primitives";
import { PhoneFrame } from "./phone/PhoneFrame";
import { ScreenFeed } from "./phone/screens";

export function Hero() {
  const ref = useRef<HTMLElement>(null);
  const reduced = useReducedMotion();
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end start"],
  });
  const phoneY = useTransform(scrollYProgress, [0, 1], [0, -48]);

  return (
    <section ref={ref} className="relative overflow-hidden pb-16 pt-28 md:pb-24 md:pt-40">
      {/* Ambient glöd */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 90% 55% at 50% -10%, rgba(29,158,117,0.12) 0%, transparent 70%)",
        }}
      />

      <Container className="relative z-10">
        <div className="grid items-center gap-12 lg:grid-cols-[1fr_auto] lg:gap-20">
          {/* Copy */}
          <div className="max-w-[640px]">
            <Reveal>
              <Label>Allsvenskan · Live · AI-analys · Forum</Label>
            </Reveal>

            <Reveal delay={0.08}>
              <h1 className="mb-6 mt-4 font-heading text-[clamp(3.75rem,11vw,8.5rem)] leading-[0.92] tracking-wide">
                Fotboll som
                <br />
                <span className="text-pitch">känns på riktigt.</span>
              </h1>
            </Reveal>

            <Reveal delay={0.16}>
              <p className="mb-8 max-w-[480px] text-[17px] leading-[1.65] text-white/65 md:mb-10 md:text-xl">
                Realtidsnyheter, AI-sammanfattningar, djupstatistik och ditt
                lags forum — i ett flöde som känns som en app, inte en webbplats.
              </p>
            </Reveal>

            <Reveal delay={0.24}>
              <div className="mb-8 flex flex-col gap-3 sm:flex-row sm:gap-4">
                <Link
                  href="/onboarding"
                  className="inline-flex h-14 items-center justify-center gap-2 rounded-2xl bg-pitch px-8 text-[17px] font-bold text-black transition-transform duration-200 hover:scale-[1.02] active:scale-[0.97]"
                >
                  Skapa ditt flöde <ArrowRight className="h-5 w-5" />
                </Link>
                <a
                  href="#upplevelsen"
                  className="inline-flex h-14 items-center justify-center gap-2 rounded-2xl border border-white/20 px-8 text-[17px] text-white transition-all duration-200 hover:border-white/45 active:scale-[0.97]"
                >
                  Se appen <ChevronDown className="h-4 w-4 text-white/50" />
                </a>
              </div>
            </Reveal>

            <Reveal delay={0.32}>
              <p className="text-sm text-white/30">
                Läst av 12 000+ Allsvenskan-fans varje omgång · Gratis att börja
              </p>
            </Reveal>
          </div>

          {/* Telefon med subtil parallax */}
          <Reveal delay={0.2} className="flex justify-center lg:justify-end">
            <motion.div style={reduced ? undefined : { y: phoneY }} className="relative">
              {/* Glöd bakom telefonen */}
              <div
                aria-hidden
                className="absolute -inset-12 rounded-full opacity-60 blur-3xl"
                style={{
                  background:
                    "radial-gradient(circle, rgba(29,158,117,0.25) 0%, transparent 65%)",
                }}
              />
              <PhoneFrame className="relative">
                <ScreenFeed />
              </PhoneFrame>
            </motion.div>
          </Reveal>
        </div>
      </Container>
    </section>
  );
}
