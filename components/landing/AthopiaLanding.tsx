"use client";

/* Athopia landningssida — native-app-känsla i webbläsaren.
   Designsystem: strikt 8px-grid, Bebas Neue + DM Sans, pitch #1D9E75 på mörk botten.
   Mockup-skärmarna återskapar appens ljusa glas-UI som riktiga komponenter.
   Touch: alla interaktiva element ≥44px, primär-CTA i tumzonen via MobileDock. */

import { LandingNav } from "./LandingNav";
import { Hero, type HeroPulse, type ClubChip, type LandingHeroCopy } from "./Hero";
import { ExperienceSection } from "./ExperienceSection";
import { DemoVignettes } from "./DemoVignettes";
import { Pricing } from "./Pricing";
import { Faq } from "./Faq";
import { FinalCta } from "./FinalCta";
import { LandingFooter } from "./LandingFooter";
import { MobileDock } from "./MobileDock";

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
    <div className="min-h-screen overflow-x-clip bg-zinc-950 font-sans text-white">
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
