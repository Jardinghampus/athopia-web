/**
 * lib/waitlist/referral.ts — "ta med en från samma lag" (v1).
 *
 * Regeln, ordagrant ur speccen: vid första LYCKADE debiteringen får båda en
 * månad på Stripe customer balance — om referrern redan är betalande och det
 * är samma lag. Tak 3 krediter per referrer och år. Ingen peng, ingen stege,
 * ingen Swish.
 *
 * Varför inte trial: en trial-faktura är 0 kr. Skulle vi fyra på den räcker det
 * att skapa konton med trial för att generera gratismånader — kostnaden är
 * verklig, spärren är att pengar faktiskt måste ha bytt ägare.
 *
 * Utbetalning sker mot Stripe-saldo, så allt här är fail-closed: när vi är
 * osäkra ger vi ingen kredit. Att missa en kredit är ett supportärende. Att
 * dela ut fel kredit är förlorade pengar vi aldrig ser igen.
 */

import "server-only";
import type Stripe from "stripe";
import { createServiceClient, isSupabaseConfigured } from "@/lib/supabase";
import { PRICING } from "@/lib/pricing";
import { referralCreditDecision, REFERRAL_CREDIT_CAP } from "./referral-gate";

export { REFERRAL_CREDIT_CAP } from "./referral-gate";

interface WaitlistReferralRow {
  id: string;
  favorite_team: string | null;
  clerk_user_id: string | null;
  referred_by: string | null;
  referral_credits_granted: number | null;
}

/**
 * Skriver en kredit på kundens Stripe-saldo. Beloppet är NEGATIVT — Stripe
 * räknar customer balance som en skuld, så ett minusbelopp är tillgodohavande
 * som dras av på nästa faktura.
 */
async function creditCustomer(
  stripe: Stripe,
  customerId: string,
  ore: number,
  description: string,
): Promise<void> {
  await stripe.customers.createBalanceTransaction(customerId, {
    amount: -ore,
    currency: "sek",
    description,
  });
}

async function stripeCustomerFor(
  clerk: { users: { getUser: (id: string) => Promise<{ privateMetadata: Record<string, unknown> }> } },
  clerkUserId: string,
): Promise<string | null> {
  try {
    const user = await clerk.users.getUser(clerkUserId);
    const id = user.privateMetadata?.stripeCustomerId;
    return typeof id === "string" && id.length > 0 ? id : null;
  } catch {
    return null;
  }
}

/**
 * Anropas efter en betald (icke-noll) faktura. Idempotent: den referrerade
 * radens `referral_credits_granted` sätts till 1 och en andra körning ser det.
 */
export async function grantReferralCreditsOnFirstPayment(opts: {
  stripe: Stripe;
  clerk: { users: { getUser: (id: string) => Promise<{ privateMetadata: Record<string, unknown> }> } };
  clerkUserId: string;
  amountPaidOre: number;
}): Promise<void> {
  const { stripe, clerk, clerkUserId, amountPaidOre } = opts;
  if (amountPaidOre <= 0) return; // trial eller 100 % rabatt — ingen kredit
  if (!isSupabaseConfigured()) return;

  try {
    const db = createServiceClient();

    const { data: referredData } = await db
      .from("waitlist")
      .select("id, favorite_team, clerk_user_id, referred_by, referral_credits_granted")
      .eq("clerk_user_id", clerkUserId)
      .maybeSingle();

    const referred = referredData as WaitlistReferralRow | null;

    const { data: referrerData } = referred?.referred_by
      ? await db
          .from("waitlist")
          .select("id, favorite_team, clerk_user_id, referred_by, referral_credits_granted")
          .eq("id", referred.referred_by)
          .maybeSingle()
      : { data: null };

    const referrer = referrerData as WaitlistReferralRow | null;
    if (referralCreditDecision({ amountPaidOre, referred, referrer }) !== "grant") return;
    if (!referred || !referrer?.clerk_user_id) return;

    // Referrern måste själv vara betalande — annars är kedjan gratis att starta.
    const referrerCustomer = await stripeCustomerFor(clerk, referrer.clerk_user_id);
    const referredCustomer = await stripeCustomerFor(clerk, clerkUserId);
    if (!referrerCustomer || !referredCustomer) return;

    const subs = await stripe.subscriptions.list({
      customer: referrerCustomer,
      status: "active",
      limit: 1,
    });
    if (subs.data.length === 0) return;

    const credit = PRICING.pro.monthly;
    await creditCustomer(stripe, referrerCustomer, credit, "Athopia — värvning, en månad på oss");
    await creditCustomer(stripe, referredCustomer, credit, "Athopia — välkommen, en månad på oss");

    await db
      .from("waitlist")
      .update({ referral_credits_granted: 1 })
      .eq("id", referred.id)
      .eq("referral_credits_granted", referred.referral_credits_granted ?? 0);

    await db
      .from("waitlist")
      .update({ referral_credits_granted: (referrer.referral_credits_granted ?? 0) + 1 })
      .eq("id", referrer.id);
  } catch (error) {
    console.error(
      "[referral] kredit misslyckades:",
      error instanceof Error ? error.message : "okänt fel",
    );
  }
}
