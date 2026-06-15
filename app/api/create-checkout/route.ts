/**
 * app/api/create-checkout/route.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Skapar en Stripe Checkout Session för Athopia PRO/Elite.
 *
 * Beslut:
 * - Plan (pro/elite) + intervall (month/year) kommer från request-body, valideras
 *   mot lib/pricing.ts. Pris byggs via inline price_data (inga Stripe Price-ID:n
 *   behövs i dashboarden).
 * - clerkUserId + plan + interval sparas i metadata → webhooken sätter rätt plan.
 * - success_url → /konto?checkout=success, cancel_url → /prenumerera.
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { auth } from "@clerk/nextjs/server";
import Stripe from "stripe";
import { NextResponse } from "next/server";
import {
  PRICING,
  amountFor,
  isPaidPlan,
  isBillingInterval,
  type PaidPlan,
  type BillingInterval,
} from "@/lib/pricing";
import { rateLimit, getClientIp } from "@/lib/rate-limit";

export async function POST(req: Request & { headers: Headers }) {
  // Lazy-init Stripe för att undvika build-time env-krav
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: "2026-04-22.dahlia",
  });
  const rl = rateLimit(`checkout:${getClientIp(req)}`, { limit: 5, windowMs: 60_000 });
  if (!rl.success) {
    return NextResponse.json({ error: "För många förfrågningar" }, { status: 429 });
  }

  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json(
      { error: "Du måste vara inloggad för att prenumerera." },
      { status: 401 }
    );
  }

  // Defaults: PRO månadsvis. Body kan override:a.
  let plan: PaidPlan = "pro";
  let interval: BillingInterval = "month";
  try {
    const body = (await req.json()) as { plan?: unknown; interval?: unknown };
    if (isPaidPlan(body.plan)) plan = body.plan;
    if (isBillingInterval(body.interval)) interval = body.interval;
  } catch {
    // Ingen/ogiltig body → behåll defaults
  }

  const planMeta = PRICING[plan];

  const base = (process.env.NEXT_PUBLIC_BASE_URL ?? "https://athopia.se").replace(/\/$/, "");

  try {
    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "sek",
            product_data: {
              name: `Athopia ${planMeta.label}`,
              description:
                interval === "year"
                  ? `${planMeta.label}-prenumeration, årsvis (25 % rabatt)`
                  : `${planMeta.label}-prenumeration, månadsvis`,
            },
            unit_amount: amountFor(plan, interval),
            recurring: { interval },
          },
          quantity: 1,
        },
      ],
      client_reference_id: userId,
      metadata: { clerkUserId: userId, plan, interval },
      success_url: `${base}/konto?checkout=success`,
      cancel_url: `${base}/prenumerera`,
      subscription_data: {
        metadata: { clerkUserId: userId, plan, interval },
      },
    });

    return NextResponse.json({ url: session.url });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[create-checkout] STRIPE ERROR:", msg);
    return NextResponse.json(
      { error: "Kunde inte skapa betalningssession.", detail: msg },
      { status: 500 }
    );
  }
}
