"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Container, Label, Reveal, Section } from "./primitives";

/** Open product CTAs — no client-side beta gate. */
export function FinalCta() {
  return (
    <Section>
      <Container>
        <div className="relative overflow-hidden rounded-3xl border border-white/[0.07] px-6 py-16 text-center md:px-20 md:py-24">
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0"
            style={{
              background:
                "radial-gradient(ellipse 70% 90% at 50% 50%, rgba(45,83,73,0.08) 0%, transparent 70%)",
            }}
          />
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 opacity-[0.03]"
            style={{
              backgroundImage:
                "radial-gradient(circle, rgba(255,255,255,0.8) 1px, transparent 1px)",
              backgroundSize: "32px 32px",
            }}
          />

          <div className="relative z-10">
            <Reveal>
              <Label>Säsongen väntar</Label>
            </Reveal>

            <Reveal delay={0.08}>
              <h2 className="mt-4 font-heading text-[clamp(3rem,9vw,7rem)] leading-[0.94] tracking-wide">
                Nästa omgång
                <br />
                läser du den
                <br />
                <span className="text-pitch">här.</span>
              </h2>
            </Reveal>

            <Reveal delay={0.16}>
              <p className="mx-auto mb-10 mt-6 max-w-[400px] text-[17px] leading-[1.65] text-white/55">
                Gratis flöde utan kort. Vill du ha briefen och signalerna —
                PRO med 7 dagar gratis, founder-pris 69 kr för de första 500.
                Avsluta när du vill.
              </p>
            </Reveal>

            <Reveal delay={0.24}>
              <Link
                href="/onboarding"
                className="inline-flex h-16 items-center justify-center gap-2 rounded-2xl bg-pitch px-10 text-lg font-bold text-white transition-transform duration-200 hover:scale-[1.02] active:scale-[0.97]"
              >
                Välj ditt lag <ArrowRight className="h-5 w-5" />
              </Link>
              <p className="mt-6 text-xs text-white/20">
                Allsvenskan 2026 · Tidig version · Uppdateras varje omgång
              </p>
            </Reveal>
          </div>
        </div>
      </Container>
    </Section>
  );
}
