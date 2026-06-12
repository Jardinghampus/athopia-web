"use client";

import { Container, Label, Display, Reveal, Section } from "./primitives";

const TESTIMONIALS = [
  {
    quote:
      "Jag förstår Allsvenskan på ett helt annat sätt nu. Det är som att äntligen ha glasögon på.",
    name: "Marcus L.",
    meta: "Djurgårdsfan sedan 1994",
    initials: "ML",
    tone: "bg-sky-700",
  },
  {
    quote:
      "Äntligen en plats där de inte skriver ner till mig. De förutsätter att jag kan fotboll. Det stämmer.",
    name: "Sara K.",
    meta: "Hammarbysupporter",
    initials: "SK",
    tone: "bg-emerald-700",
  },
  {
    quote:
      "Matchrapporterna läser jag alltid på måndag morgon. Bättre start på veckan finns inte.",
    name: "Johan A.",
    meta: "AIK-fan, Göteborg",
    initials: "JA",
    tone: "bg-zinc-700",
  },
];

export function Testimonials() {
  return (
    <Section>
      <Container>
        <div className="mb-12 text-center md:mb-20">
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

        <div className="grid grid-cols-1 gap-4 md:grid-cols-3 md:gap-5">
          {TESTIMONIALS.map(({ quote, name, meta, initials, tone }, i) => (
            <Reveal key={name} delay={0.08 + i * 0.08}>
              <figure className="flex h-full flex-col gap-5 rounded-3xl border border-white/[0.06] bg-white/[0.025] p-6 transition-colors duration-300 hover:border-white/[0.12] md:p-8">
                <span
                  aria-hidden
                  className="select-none font-heading text-5xl leading-none text-pitch"
                >
                  &rdquo;
                </span>
                <blockquote className="flex-1 text-[17px] leading-[1.65] text-white/80">
                  {quote}
                </blockquote>
                <figcaption className="flex items-center gap-3 border-t border-white/[0.06] pt-5">
                  <div
                    className={`flex h-10 w-10 items-center justify-center rounded-full text-xs font-bold text-white ${tone}`}
                  >
                    {initials}
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-white">{name}</div>
                    <div className="mt-0.5 text-xs text-white/35">{meta}</div>
                  </div>
                </figcaption>
              </figure>
            </Reveal>
          ))}
        </div>
      </Container>
    </Section>
  );
}
