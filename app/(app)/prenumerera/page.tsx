/**
 * app/prenumerera/page.tsx — Prissida
 * ─────────────────────────────────────────────────────────────────────────────
 * Free / PRO 89 kr / Elite 169 kr — 25 % rabatt på årsplan.
 * Plan-val + Stripe Checkout sker i PricingPlans (Client Component).
 * ─────────────────────────────────────────────────────────────────────────────
 */

import type { Metadata } from "next";
import { Zap } from "lucide-react";
import { FOUNDER_OFFER, TRIAL_DAYS } from "@/lib/pricing";
import { PricingPlans } from "./PricingPlans";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Priser & Prenumeration",
  description:
    "Athopia PRO — daglig AI-brief för ditt lag, poddintelligens och transfer-signaler. Founder-pris 69 kr/mån för alltid för de första 500. 25 % rabatt på årsplan.",
  alternates: { canonical: "https://athopia.se/prenumerera" },
  openGraph: {
    type: "website",
    locale: "sv_SE",
    url: "https://athopia.se/prenumerera",
    title: "Priser & Prenumeration",
    description: "Gratis, PRO eller Elite — välj din plan för Allsvenskan-bevakning på djupet.",
  },
};

function PricingJsonLd() {
  return (
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
      "@context": "https://schema.org",
      "@type": "ItemList",
      name: "Athopia prenumerationsplaner",
      itemListElement: [
        {
          "@type": "ListItem", position: 1,
          item: { "@type": "Product", name: "Athopia Gratis", offers: { "@type": "Offer", price: "0", priceCurrency: "SEK", availability: "https://schema.org/InStock" } },
        },
        {
          "@type": "ListItem", position: 2,
          item: { "@type": "Product", name: "Athopia PRO", offers: { "@type": "Offer", price: "69", priceCurrency: "SEK", availability: "https://schema.org/InStock" } },
        },
        {
          "@type": "ListItem", position: 3,
          item: { "@type": "Product", name: "Athopia Elite", offers: { "@type": "Offer", price: "169", priceCurrency: "SEK", availability: "https://schema.org/InStock" } },
        },
      ],
    })}} />
  );
}

export default function PrenumereraPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-20">
      <PricingJsonLd />
      {/* Rubrik */}
      <div className="text-center mb-12">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-pitch/15 border border-pitch/30 text-pitch text-sm font-medium mb-6">
          <Zap className="w-4 h-4" />
          {FOUNDER_OFFER.active
            ? `Founder-pris: 69 kr/mån för alltid — först till ${FOUNDER_OFFER.cap}`
            : `PRO ${TRIAL_DAYS} dagar gratis · sedan 89 kr/mån`}
        </div>
        <h1 className="font-bold text-6xl sm:text-7xl text-foreground mb-4">
          ALLSVENSKANS HEMMAPLAN
        </h1>
        <p className="text-muted-foreground text-lg max-w-xl mx-auto">
          Allt som sägs och händer kring din klubb — läst, lyssnat och
          siffergranskat åt dig. Varje morgon.
        </p>
      </div>

      <PricingPlans />

      <p className="text-center text-sm text-muted-foreground mt-10 max-w-lg mx-auto">
        Gratis ger dig flödet. PRO ger dig morgonbriefen, poddintelligensen och
        transfer-signalerna — det som tar bort nio flikar. Elite lägger till
        clustering och ”vad som spelar roll idag”.
      </p>

      <p className="text-center text-xs text-muted-foreground mt-6">
        {TRIAL_DAYS} dagar gratis · Betalning via Stripe · SSL · Avbryt när som helst
      </p>
    </div>
  );
}
