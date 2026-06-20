"use client";

import Link from "next/link";
import { Check, ArrowRight } from "lucide-react";
import { Container, Label, Display, Reveal, Section } from "./primitives";

const PLANS = [
  {
    name: "Gratis",
    price: "0",
    tagline: "För dig som vill testa.",
    cta: "Kom igång",
    href: "/onboarding",
    highlighted: false,
    features: [
      "Välj lag & liga",
      "Headlines med källänk",
      "20 nyheter per dag",
      "Läs forumet",
    ],
  },
  {
    name: "PRO",
    price: "99",
    tagline: "För dig som följer varje omgång.",
    cta: "Uppgradera till PRO",
    href: "/prenumerera",
    highlighted: true,
    features: [
      "Obegränsat flöde",
      "AI-sammanfattningar per lag & match",
      "Smart ranking — viktigast först",
      "Filter: transfers, skador, statistik",
      "Push-notiser",
      "Skriv i forumet",
    ],
  },
  {
    name: "Elite",
    price: "199",
    tagline: "För dig som vill se allt först.",
    cta: "Skaffa Elite",
    href: "/prenumerera",
    highlighted: false,
    features: [
      "Allt i PRO",
      "Cross-source clustering",
      "”Det viktigaste idag” för din klubb",
      "Trenddetektering på rykten",
    ],
  },
];

export function Pricing() {
  return (
    <Section id="priser">
      <Container>
        <div className="mb-12 text-center md:mb-20">
          <Reveal>
            <Label>Priser</Label>
          </Reveal>
          <Reveal delay={0.08}>
            <Display size="lg" className="mt-4">
              Börja gratis.
              <br />
              Stanna för djupet.
            </Display>
          </Reveal>
          <Reveal delay={0.16}>
            <p className="mx-auto mt-6 max-w-[400px] text-[17px] leading-[1.65] text-white/55">
              Inget kreditkort för att börja. Avsluta när du vill, med en
              knapptryckning.
            </p>
          </Reveal>
        </div>

        <div className="grid grid-cols-1 items-stretch gap-4 md:grid-cols-3 md:gap-5">
          {PLANS.map(({ name, price, tagline, cta, href, highlighted, features }, i) => (
            <Reveal key={name} delay={0.06 + i * 0.08}>
              <div
                className={`relative flex h-full flex-col rounded-3xl border p-6 md:p-8 ${
                  highlighted
                    ? "border-pitch/40 bg-pitch/[0.05] shadow-[0_0_48px_-12px_rgba(29,158,117,0.25)]"
                    : "border-white/[0.06] bg-white/[0.025]"
                }`}
              >
                {highlighted && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-pitch px-3 py-1 text-[10px] font-bold uppercase tracking-[0.14em] text-black">
                    Populärast
                  </span>
                )}

                <h3 className="font-heading text-2xl tracking-widest text-white">{name}</h3>
                <div className="mt-4 flex items-baseline gap-1.5">
                  <span className="font-heading text-6xl tracking-wide text-white">{price}</span>
                  <span className="text-sm text-white/40">kr/mån</span>
                </div>
                <p className="mt-2 text-sm text-white/50">{tagline}</p>

                <ul className="mt-6 flex flex-1 flex-col gap-3 border-t border-white/[0.06] pt-6">
                  {features.map((f) => (
                    <li key={f} className="flex items-start gap-2.5 text-sm text-white/70">
                      <Check
                        className={`mt-0.5 h-4 w-4 shrink-0 ${
                          highlighted ? "text-pitch" : "text-white/30"
                        }`}
                        strokeWidth={3}
                      />
                      {f}
                    </li>
                  ))}
                </ul>

                <Link
                  href={href}
                  className={`mt-8 inline-flex h-14 items-center justify-center gap-2 rounded-2xl text-[16px] font-bold transition-transform duration-200 hover:scale-[1.02] active:scale-[0.97] ${
                    highlighted
                      ? "bg-pitch text-black"
                      : "border border-white/15 text-white hover:border-white/35"
                  }`}
                >
                  {cta} <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </Reveal>
          ))}
        </div>
      </Container>
    </Section>
  );
}
