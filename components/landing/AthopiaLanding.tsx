"use client";

/* Athopia landningssida — native-app-känsla i webbläsaren.
   Designsystem: strikt 8px-grid, Bebas Neue + DM Sans, pitch #1D9E75 på mörk botten.
   Mockup-skärmarna återskapar appens ljusa glas-UI som riktiga komponenter.
   Touch: alla interaktiva element ≥44px, primär-CTA i tumzonen via MobileDock. */

import { LandingNav } from "./LandingNav";
import { Hero } from "./Hero";
import { SocialProof } from "./SocialProof";
import { ExperienceSection } from "./ExperienceSection";
import { BentoFeatures } from "./BentoFeatures";
import { Testimonials } from "./Testimonials";
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

export default function AthopiaLanding({}: { articles?: LandingArticle[] } = {}) {
  return (
    <div className="min-h-screen overflow-x-clip bg-[#0A0A0A] font-sans text-white">
      <LandingNav />
      <main>
        <Hero />
        <SocialProof />
        <ExperienceSection />
        <BentoFeatures />
        <Testimonials />
        <Pricing />
        <Faq />
        <FinalCta />
      </main>
      <LandingFooter />
      <MobileDock />
    </div>
  );
}
