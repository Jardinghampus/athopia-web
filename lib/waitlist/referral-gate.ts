/**
 * Rena grindar för värvningskredit. Stripe-anropet ligger i referral.ts;
 * det här är det som går att testa utan nät.
 */

export const REFERRAL_CREDIT_CAP = 3;

export type ReferralGateReason =
  | "unpaid"
  | "no_referral"
  | "already_granted"
  | "referrer_missing"
  | "different_team"
  | "cap_reached"
  | "grant";

export function referralCreditDecision(opts: {
  amountPaidOre: number;
  referred: {
    referred_by: string | null;
    referral_credits_granted: number | null;
    favorite_team: string | null;
  } | null;
  referrer: {
    clerk_user_id: string | null;
    referral_credits_granted: number | null;
    favorite_team: string | null;
  } | null;
}): ReferralGateReason {
  if (opts.amountPaidOre <= 0) return "unpaid";
  if (!opts.referred?.referred_by) return "no_referral";
  if ((opts.referred.referral_credits_granted ?? 0) > 0) return "already_granted";
  if (!opts.referrer?.clerk_user_id) return "referrer_missing";
  if (!opts.referred.favorite_team || opts.referred.favorite_team !== opts.referrer.favorite_team) {
    return "different_team";
  }
  if ((opts.referrer.referral_credits_granted ?? 0) >= REFERRAL_CREDIT_CAP) return "cap_reached";
  return "grant";
}
