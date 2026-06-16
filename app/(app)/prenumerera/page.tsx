/**
 * app/prenumerera/page.tsx — Prissida
 * ─────────────────────────────────────────────────────────────────────────────
 * Free / PRO 89 kr / Elite 169 kr — 25 % rabatt på årsplan.
 * Plan-val + Stripe Checkout sker i PricingPlans (Client Component).
 * ─────────────────────────────────────────────────────────────────────────────
 */

import type { Metadata } from "next";
import { Zap } from "lucide-react";
import { PricingPlans } from "./PricingPlans";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Priser — Athopia",
  description:
    "Uppgradera till Athopia PRO (89 kr/mån) eller Elite (169 kr/mån) — obegränsat flöde, AI-sammanfattningar, smart ranking och mer. 25 % rabatt på årsplan.",
};

export default function PrenumereraPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-20">
      {/* Rubrik */}
      <div className="text-center mb-12">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-pitch/15 border border-pitch/30 text-pitch text-sm font-medium mb-6">
          <Zap className="w-4 h-4" />
          Athopia Premium
        </div>
        <h1 className="font-bold text-6xl sm:text-7xl text-foreground mb-4">
          FOTBOLL PÅ DJUPET
        </h1>
        <p className="text-muted-foreground text-lg max-w-xl mx-auto">
          Obegränsat flöde, AI-analys och exklusivt djupinnehåll. Välj den nivå
          som passar dig.
        </p>
      </div>

      <PricingPlans />

      {/* Trygghet */}
      <p className="text-center text-xs text-muted-foreground mt-10">
        Betalning hanteras säkert av Stripe · SSL-krypterad · Avbryt när som helst
      </p>
    </div>
  );
}
