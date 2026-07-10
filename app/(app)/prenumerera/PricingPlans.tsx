"use client";

/**
 * PricingPlans — Client Component
 * Prisplaner (Free / PRO / Elite) med månad/år-växel och founder-erbjudande.
 * Strategi (Allsvenskans hemmaplan 2026-07-10): gratisplanen är generös
 * (obegränsad feed + push — FotMob-paritet); PRO säljer det unika: daglig
 * AI-brief, poddintelligens och transfer-signaler.
 */

import { useState } from "react";
import { Check, Star } from "lucide-react";
import { CheckoutButton } from "./CheckoutButton";
import {
  FOUNDER_OFFER,
  PRICING,
  amountFor,
  formatKr,
  monthlyEquivalent,
  type BillingInterval,
  type PaidPlan,
} from "@/lib/pricing";

const FREE_FEATURES = [
  "Obegränsat nyhetsflöde för ditt lag",
  "Push-notiser — mål, transfers, avspark",
  "Live-resultat, tabell & statistik",
  "Forum (läsning)",
];

const PRO_FEATURES = [
  "Daglig AI-brief för ditt lag — text & ljud, varje morgon 07:00",
  "Poddintelligens — sök i allt som sägs i Allsvenskans poddar",
  "Transfer-signaler med källkonfidens (multi-source)",
  "xG-analys & avancerade filter",
  "Smart ranking + AI-chat",
  "Forum (skriva)",
];

const ELITE_FEATURES = [
  "Allt i PRO",
  "Cross-source clustering",
  "Vad som spelar roll idag för ditt lag",
  "Trend detection (eskalerande rykten)",
  "Export / API (kommande)",
];

function ProPriceTag({ interval }: { interval: BillingInterval }) {
  const amount = amountFor("pro", interval);
  const ordinary = interval === "year" ? PRICING.pro.yearly : PRICING.pro.monthly;
  const founder = FOUNDER_OFFER.active;
  return (
    <div className="mb-6">
      <h2 className="font-semibold text-2xl text-pitch mb-1">PRO</h2>
      <div className="flex items-baseline gap-2">
        <span className="text-4xl font-bold text-foreground">{amount / 100}</span>
        <span className="text-muted-foreground text-sm">kr / {interval === "year" ? "år" : "mån"}</span>
        {founder && (
          <span className="text-sm text-muted-foreground line-through">{ordinary / 100} kr</span>
        )}
      </div>
      {founder ? (
        <p className="text-xs text-pitch mt-1 font-medium">
          Founder-pris för alltid — först till {FOUNDER_OFFER.cap}
          {interval === "year" && <> · motsvarar {formatKr(Math.round(amountFor("pro", "year") / 12))}/mån</>}
        </p>
      ) : interval === "year" ? (
        <p className="text-xs text-pitch mt-1">
          Motsvarar {formatKr(monthlyEquivalent("pro"))}/mån · spara 25 %
        </p>
      ) : (
        <p className="text-xs text-muted-foreground mt-1">Avbryt när som helst</p>
      )}
    </div>
  );
}

function ElitePriceTag({ interval }: { interval: BillingInterval }) {
  const amount = amountFor("elite", interval);
  return (
    <div className="mb-6">
      <h2 className="font-semibold text-2xl text-pitch mb-1">ELITE</h2>
      <div className="flex items-baseline gap-1">
        <span className="text-4xl font-bold text-foreground">{amount / 100}</span>
        <span className="text-muted-foreground text-sm">kr / {interval === "year" ? "år" : "mån"}</span>
      </div>
      {interval === "year" ? (
        <p className="text-xs text-pitch mt-1">
          Motsvarar {formatKr(monthlyEquivalent("elite"))}/mån · spara 25 %
        </p>
      ) : (
        <p className="text-xs text-muted-foreground mt-1">Avbryt när som helst</p>
      )}
    </div>
  );
}

function FeatureList({ features, paid, hero }: { features: string[]; paid: boolean; hero?: number }) {
  return (
    <ul className="flex flex-col gap-3 flex-1 mb-6">
      {features.map((f, i) => (
        <li
          key={f}
          className={`flex items-start gap-3 text-sm ${paid ? "text-foreground" : "text-muted-foreground"} ${hero !== undefined && i < hero ? "font-medium" : ""}`}
        >
          {hero !== undefined && i < hero ? (
            <Star className="w-4 h-4 shrink-0 text-pitch mt-0.5" />
          ) : (
            <Check className={`w-4 h-4 shrink-0 mt-0.5 ${paid ? "text-pitch" : "text-muted-foreground"}`} />
          )}
          {f}
        </li>
      ))}
    </ul>
  );
}

export function PricingPlans() {
  const [interval, setBilling] = useState<BillingInterval>("month");

  return (
    <>
      {/* Intervall-växel */}
      <div className="flex justify-center mb-10">
        <div className="inline-flex items-center rounded-full border border-border bg-card p-1">
          <button
            onClick={() => setBilling("month")}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
              interval === "month" ? "pitch-gradient text-white" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Månadsvis
          </button>
          <button
            onClick={() => setBilling("year")}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
              interval === "year" ? "pitch-gradient text-white" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Årsvis <span className="text-pitch-light">−25 %</span>
          </button>
        </div>
      </div>

      {/* Planer */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 max-w-4xl mx-auto items-stretch">
        {/* Gratis */}
        <div className="rounded-2xl border border-border bg-card p-6 flex flex-col">
          <div className="mb-6">
            <h2 className="font-semibold text-2xl text-foreground mb-1">GRATIS</h2>
            <div className="flex items-baseline gap-1">
              <span className="text-4xl font-bold text-foreground">0</span>
              <span className="text-muted-foreground text-sm">kr / mån</span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">Inget kort behövs</p>
          </div>
          <FeatureList features={FREE_FEATURES} paid={false} />
          <div className="h-11 rounded-xl border border-border flex items-center justify-center text-sm text-muted-foreground">
            Nuvarande plan
          </div>
        </div>

        {/* PRO */}
        <div className="relative rounded-2xl border border-pitch/40 bg-card p-6 flex flex-col pitch-glow">
          <div className="absolute -top-3 left-6">
            <span className="px-3 py-1 rounded-full pitch-gradient text-white text-xs font-medium">
              {FOUNDER_OFFER.active ? `Founder — först till ${FOUNDER_OFFER.cap}` : "Populärast"}
            </span>
          </div>
          <ProPriceTag interval={interval} />
          <FeatureList features={PRO_FEATURES} paid hero={3} />
          <CheckoutButton plan="pro" interval={interval} label="Bli founder" />
        </div>

        {/* Elite */}
        <div className="rounded-2xl border border-border bg-card p-6 flex flex-col">
          <ElitePriceTag interval={interval} />
          <FeatureList features={ELITE_FEATURES} paid />
          <CheckoutButton plan="elite" interval={interval} label="Välj Elite" variant="outline" />
        </div>
      </div>
    </>
  );
}
