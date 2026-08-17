/**
 * lib/waitlist/founder-rules.ts — reglerna för VEM som får Founder-priset.
 *
 * Rena funktioner, medvetet skilda från `cohort.ts` (som är `server-only` och
 * träffar DB). Det här är regeln som avgör vad kortet dras på, och en regel som
 * bara går att verifiera genom att köra en riktig Stripe-checkout blir aldrig
 * testad.
 */

import type { PaidPlan } from "@/lib/pricing";

export type Cohort = "founder" | "regular" | null;

/**
 * Har den här betraktaren rätt till Founder-priset?
 *
 * Fyra fall, i den här ordningen:
 *   1. Elite → aldrig Founder.
 *   2. Waitlist-kohort `founder` → alltid Founder, även när potten är slut.
 *      Det är ett låst avtal, inte ett publikt erbjudande.
 *   3. WAITLIST_MODE → ingen walk-in-Founder. Kön fylls; /prenumerera får inte
 *      äta platser.
 *   4. Walk-in UTAN waitlist-rad → Founder bara medan potten är öppen.
 *
 * Notera fall 3:s `!waitlist`: den som står i kön som `regular` får aldrig
 * Founder, inte ens medan potten råkar vara öppen. Hen har redan fått sin
 * kohort tilldelad, och att låta hen köpa runt den gör kön meningslös.
 */
export function isEntitledToFounder(opts: {
  plan: PaidPlan;
  waitlist: { cohort: Cohort } | null;
  founderOfferPublic: boolean;
  /** Medan kön är öppen får walk-in inte äta pott-platser via /prenumerera. */
  waitlistMode?: boolean;
}): boolean {
  if (opts.plan !== "pro") return false;
  if (opts.waitlist?.cohort === "founder") return true;
  if (opts.waitlistMode) return false;
  return opts.founderOfferPublic && !opts.waitlist;
}

/**
 * Tar den här köparen en POTT-plats också? En waitlist-founder har redan sin —
 * att räkna den två gånger skulle bränna två av de 500 på en person.
 */
export function claimsPotSeat(waitlist: { cohort: Cohort } | null): boolean {
  return waitlist?.cohort !== "founder";
}
