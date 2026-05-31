/**
 * app/prenumerera/page.tsx — Prissida
 * ─────────────────────────────────────────────────────────────────────────────
 * - 39 SEK/mån PRO-plan
 * - Feature-lista
 * - Stripe Checkout-knapp (Client Component)
 * ─────────────────────────────────────────────────────────────────────────────
 */

import type { Metadata } from "next";
import { Check, Zap } from "lucide-react";
import { CheckoutButton } from "./CheckoutButton";

export const metadata: Metadata = {
  title: "PRO — Athopia",
  description: "Uppgradera till Athopia PRO för 39 kr/mån och få tillgång till fullständiga transkript, djupanalys och exklusivt innehåll.",
};

const FREE_FEATURES = [
  "Fotbollsnyheter & narrativ",
  "Live-matchresultat",
  "Lagprofiler & statistik",
  "Podcast-avsnitt (lyssning)",
];

const PRO_FEATURES = [
  "Allt i gratis-planen",
  "Fullständiga AI-transkript",
  "Tidsstämplar & entity-sökning",
  "Djupanalys & sentiment-data",
  "Prioriterad support",
  "Tidigt tillgång till nya funktioner",
];

export default function PrenumereraPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-20">
      {/* Rubrik */}
      <div className="text-center mb-16">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-pitch/15 border border-pitch/30 text-pitch text-sm font-medium mb-6">
          <Zap className="w-4 h-4" />
          Athopia PRO
        </div>
        <h1 className="font-heading text-6xl sm:text-7xl text-foreground mb-4">
          FOTBOLL PÅ DJUPET
        </h1>
        <p className="text-muted-foreground text-lg max-w-xl mx-auto">
          Allt du behöver för att följa fotboll som ett proffs. Fullt transkript,
          AI-analys och exklusivt djupinnehåll.
        </p>
      </div>

      {/* Prisplaner */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 max-w-2xl mx-auto">
        {/* Gratis */}
        <div className="rounded-2xl border border-border bg-card p-6 flex flex-col">
          <div className="mb-6">
            <h2 className="font-heading text-2xl text-foreground mb-1">GRATIS</h2>
            <div className="flex items-baseline gap-1">
              <span className="text-4xl font-heading text-foreground">0</span>
              <span className="text-muted-foreground text-sm">kr / mån</span>
            </div>
          </div>

          <ul className="flex flex-col gap-3 flex-1 mb-6">
            {FREE_FEATURES.map((f) => (
              <li key={f} className="flex items-center gap-3 text-sm text-muted-foreground">
                <Check className="w-4 h-4 text-muted-foreground shrink-0" />
                {f}
              </li>
            ))}
          </ul>

          <div className="h-10 rounded-xl border border-border flex items-center justify-center text-sm text-muted-foreground">
            Nuvarande plan
          </div>
        </div>

        {/* PRO */}
        <div className="relative rounded-2xl border border-pitch/40 bg-card p-6 flex flex-col pitch-glow">
          {/* Badge */}
          <div className="absolute -top-3 left-6">
            <span className="px-3 py-1 rounded-full pitch-gradient text-white text-xs font-medium">
              Populärast
            </span>
          </div>

          <div className="mb-6">
            <h2 className="font-heading text-2xl text-pitch mb-1">PRO</h2>
            <div className="flex items-baseline gap-1">
              <span className="text-4xl font-heading text-foreground">39</span>
              <span className="text-muted-foreground text-sm">kr / mån</span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Avbryt när som helst
            </p>
          </div>

          <ul className="flex flex-col gap-3 flex-1 mb-6">
            {PRO_FEATURES.map((f) => (
              <li key={f} className="flex items-center gap-3 text-sm text-foreground">
                <Check className="w-4 h-4 text-pitch shrink-0" />
                {f}
              </li>
            ))}
          </ul>

          {/* Stripe Checkout-knapp (Client Component) */}
          <CheckoutButton />
        </div>
      </div>

      {/* Trygghet */}
      <p className="text-center text-xs text-muted-foreground mt-10">
        Betalning hanteras säkert av Stripe · SSL-krypterad · Avbryt när som helst
      </p>
    </div>
  );
}
