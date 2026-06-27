"use client";

import { Container, Label, Display, Reveal, Section } from "./primitives";
import { PhoneFrame } from "./phone/PhoneFrame";
import { ScreenFeed, ScreenMatch, ScreenExplore } from "./phone/screens";

const SCREENS = [
  {
    key: "flode",
    title: "Ditt flöde",
    text: "Signalstyrda nyheter från 40+ källor — viktigast först.",
    Screen: ScreenFeed,
  },
  {
    key: "matchdag",
    title: "Matchdag live",
    text: "Liveresultat, matchstatistik och forumet som kokar.",
    Screen: ScreenMatch,
  },
  {
    key: "utforska",
    title: "Utforska & filtrera",
    text: "Transfers, skador, tabeller — filtrera på det du bryr dig om.",
    Screen: ScreenExplore,
  },
];

export function ExperienceSection() {
  return (
    <Section id="upplevelsen">
      <Container>
        <div className="mb-12 text-center md:mb-20">
          <Reveal>
            <Label>Upplevelsen</Label>
          </Reveal>
          <Reveal delay={0.08}>
            <Display size="lg" className="mt-4">
              Byggd som en app.
              <br />
              Öppnas som en länk.
            </Display>
          </Reveal>
          <Reveal delay={0.16}>
            <p className="mx-auto mt-6 max-w-[440px] text-[17px] leading-[1.65] text-white/55">
              Ingen nedladdning, inget App Store. Lägg till på hemskärmen och
              Athopia beter sig som vilken app som helst — fast snabbare.
            </p>
          </Reveal>
        </div>
      </Container>

      {/* Mobil: horisontell snap-karusell med peek. Desktop: 3-up, mitten upphöjd. */}
      <Reveal delay={0.1}>
        <div className="scrollbar-none flex snap-x snap-mandatory gap-8 overflow-x-auto px-6 pb-4 pt-2 lg:justify-center lg:overflow-visible lg:px-8">
          {SCREENS.map(({ key, title, text, Screen }, i) => (
            <div
              key={key}
              className={`flex shrink-0 snap-center flex-col items-center ${
                i === 1 ? "lg:-mt-8" : "lg:mt-8"
              }`}
            >
              <div className="transition-transform duration-300 lg:hover:-translate-y-2">
                <PhoneFrame>
                  <Screen />
                </PhoneFrame>
              </div>
              <div className="mt-6 max-w-[260px] text-center">
                <h3 className="font-sans text-[17px] font-bold text-white">{title}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-white/45">{text}</p>
              </div>
            </div>
          ))}
        </div>
      </Reveal>

      {/* Svep-hint, endast mobil */}
      <p className="mt-2 text-center text-xs text-white/25 lg:hidden">
        Svep för att se fler skärmar
      </p>
    </Section>
  );
}
