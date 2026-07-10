/**
 * lib/pricing.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * En sanningskälla för Athopias prismodell. Används av prissidan,
 * create-checkout och (via metadata) Stripe-webhooken.
 *
 * Free / PRO 89 kr / Elite 169 kr — 25 % rabatt på årsplan.
 * Belopp lagras i öre (Stripe-konvention).
 * ─────────────────────────────────────────────────────────────────────────────
 */

export type PaidPlan = "pro" | "elite";
export type BillingInterval = "month" | "year";

export const ANNUAL_DISCOUNT = 0.25;

interface PlanPricing {
  label: string;
  /** Pris per månad i öre. */
  monthly: number;
  /** Pris per år i öre (redan med 25 % rabatt). */
  yearly: number;
}

export const PRICING: Record<PaidPlan, PlanPricing> = {
  // 89 kr/mån · 801 kr/år (89×12×0.75)
  pro: { label: "PRO", monthly: 8900, yearly: 80100 },
  // 169 kr/mån · 1521 kr/år (169×12×0.75)
  elite: { label: "Elite", monthly: 16900, yearly: 152100 },
};

/**
 * Founder-erbjudande: PRO 69 kr/mån FÖR ALLTID för de första 500 betalande.
 * Priset låses i Stripe-prenumerationen vid köp — ingen migrering behövs när
 * erbjudandet stängs. 500-taket stängs genom att flippa `active` till false;
 * antal betalande syns i admin-funnelpanelen (checkout_success).
 */
export const FOUNDER_OFFER = {
  active: true,
  cap: 500,
  // 69 kr/mån · 621 kr/år (69×12×0.75)
  pricing: { label: "PRO Founder", monthly: 6900, yearly: 62100 } as PlanPricing,
} as const;

/** Belopp i öre för en given plan + intervall. Founder-pris gäller enbart PRO. */
export function amountFor(plan: PaidPlan, interval: BillingInterval): number {
  const p = plan === "pro" && FOUNDER_OFFER.active ? FOUNDER_OFFER.pricing : PRICING[plan];
  return interval === "year" ? p.yearly : p.monthly;
}

export function isPaidPlan(v: unknown): v is PaidPlan {
  return v === "pro" || v === "elite";
}

export function isBillingInterval(v: unknown): v is BillingInterval {
  return v === "month" || v === "year";
}

/** Formaterar öre → "89 kr" / "66,75 kr". */
export function formatKr(ore: number): string {
  const kr = ore / 100;
  return Number.isInteger(kr) ? `${kr} kr` : `${kr.toFixed(2).replace(".", ",")} kr`;
}

/** Pris per månad vid årsplan (öre) — för "motsvarar X kr/mån". */
export function monthlyEquivalent(plan: PaidPlan): number {
  return Math.round(PRICING[plan].yearly / 12);
}
