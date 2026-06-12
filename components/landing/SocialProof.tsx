"use client";

import { Container, Reveal } from "./primitives";

const STATS = [
  { value: "12 000+", label: "fans varje omgång" },
  { value: "291", label: "artiklar denna säsong" },
  { value: "40+", label: "bevakade källor" },
  { value: "16", label: "lagforum" },
];

const CLUBS = [
  "AIK", "Hammarby", "Djurgården", "Malmö FF", "IFK Göteborg", "Häcken",
  "Elfsborg", "IFK Norrköping", "BK Häcken", "Sirius", "Mjällby", "Värnamo",
];

export function SocialProof() {
  return (
    <section className="border-t border-white/[0.06] py-12 md:py-16">
      <Container>
        <Reveal>
          <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
            {STATS.map(({ value, label }) => (
              <div key={label} className="text-center">
                <div className="font-heading text-4xl tracking-wider text-white md:text-5xl">
                  {value}
                </div>
                <div className="mt-2 text-sm text-white/40">{label}</div>
              </div>
            ))}
          </div>
        </Reveal>
      </Container>

      {/* Klubb-marquee med fade-kanter */}
      <Reveal delay={0.12}>
        <div
          className="relative mt-12 overflow-hidden md:mt-16"
          style={{
            maskImage:
              "linear-gradient(to right, transparent, black 15%, black 85%, transparent)",
          }}
        >
          <div className="animate-marquee flex w-max gap-4">
            {[...CLUBS, ...CLUBS].map((club, i) => (
              <span
                key={`${club}-${i}`}
                className="flex h-12 shrink-0 items-center rounded-full border border-white/[0.08] bg-white/[0.03] px-6 font-heading text-lg tracking-widest text-white/50"
              >
                {club}
              </span>
            ))}
          </div>
        </div>
      </Reveal>
    </section>
  );
}
