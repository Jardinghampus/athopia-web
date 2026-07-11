"use client";

/* Athopia landningssida — native-app-känsla i webbläsaren.
   Designsystem: docs/brand/BRAND.md — 8px-grid, Geist, Racing Green #2D5349 på true black.
   Mockup-skärmarna återskapar appens ljusa glas-UI som riktiga komponenter.
   Touch: alla interaktiva element ≥44px, primär-CTA i tumzonen via MobileDock. */

import dynamic from "next/dynamic";
import { LandingNav } from "./LandingNav";
import { Hero, type HeroPulse, type ClubChip, type LandingHeroCopy } from "./Hero";
import { LandingFooter } from "./LandingFooter";
import { MobileDock } from "./MobileDock";

/* Below-fold marketing-sektioner behövs inte för första paint/hydrering.
   next/dynamic(ssr:false) delar upp dem i egna chunks som laddas EFTER
   ovanför-vikten (nav+hero+MobileDock) har hydrerats — så deras JS
   (inkl. motion/react-animationer) blockerar inte FCP/TBT. Ren client-only
   kod (ingen data-fetch, ingen SEO-text att SSR:a) så ssr:false är säkert. */
const DemoVignettes = dynamic(() => import("./DemoVignettes").then((m) => m.DemoVignettes), {
  ssr: false,
});
const ExperienceSection = dynamic(() => import("./ExperienceSection").then((m) => m.ExperienceSection), {
  ssr: false,
});
const Pricing = dynamic(() => import("./Pricing").then((m) => m.Pricing), { ssr: false });
const Faq = dynamic(() => import("./Faq").then((m) => m.Faq), { ssr: false });
const FinalCta = dynamic(() => import("./FinalCta").then((m) => m.FinalCta), { ssr: false });

/** Kompat med app/page.tsx tills nya landningen kopplar in nyhetsdata. */
export interface LandingArticle {
  id: string;
  slug: string;
  title: string;
  summary: string;
  sourceName: string;
  publishedAt: string;
}

export default function AthopiaLanding({
  sportSlot,
  pulse,
  clubs,
  heroCopy,
}: {
  articles?: LandingArticle[];
  /** Server-renderad sportsektion (matchcenter/tabell/nyheter) — sport före marketing. */
  sportSlot?: React.ReactNode;
  pulse?: HeroPulse;
  clubs?: ClubChip[];
  heroCopy?: LandingHeroCopy;
} = {}) {
  return (
    <div className="min-h-screen overflow-x-clip bg-black font-sans text-white">
      <LandingNav />
      <main>
        <Hero pulse={pulse} clubs={clubs} copy={heroCopy} />
        {sportSlot}
        <DemoVignettes />
        <ExperienceSection />
        <Pricing />
        <Faq />
        <FinalCta />
      </main>
      <LandingFooter />
      <MobileDock />
    </div>
  );
}
