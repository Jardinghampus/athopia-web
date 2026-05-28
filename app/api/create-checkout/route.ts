/**
 * app/api/create-checkout/route.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Skapar en Stripe Checkout Session för Athopia PRO.
 *
 * Beslut:
 * - Pris: 3900 öre (39 SEK) / månad, recurring subscription.
 * - success_url → /konto?checkout=success
 * - cancel_url  → /prenumerera
 * - Clerk userId skickas som client_reference_id för webhook-mappning.
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { auth } from "@clerk/nextjs/server";
import Stripe from "stripe";
import { NextResponse } from "next/server";

export async function POST() {
  // Lazy-init Stripe för att undvika build-time env-krav
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: "2026-04-22.dahlia",
  });
  const { userId } = await auth();

  // Kräv att användaren är inloggad
  if (!userId) {
    return NextResponse.json(
      { error: "Du måste vara inloggad för att prenumerera." },
      { status: 401 }
    );
  }

  try {
    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "sek",
            product_data: {
              name: "Athopia PRO",
              description: "Fullständiga transkript, AI-analys och exklusivt innehåll.",
              images: ["https://athopia.se/og-default.png"],
            },
            unit_amount: 3900, // 39.00 SEK i öre
            recurring: { interval: "month" },
          },
          quantity: 1,
        },
      ],
      // Koppla Clerk user till Stripe session
      client_reference_id: userId,
      // Sparas i metadata för webhook-hantering
      metadata: { clerkUserId: userId },
      success_url: `${process.env.NEXT_PUBLIC_BASE_URL}/konto?checkout=success`,
      cancel_url: `${process.env.NEXT_PUBLIC_BASE_URL}/prenumerera`,
      // Billing-portal aktivas automatiskt
      subscription_data: {
        metadata: { clerkUserId: userId },
      },
    });

    return NextResponse.json({ url: session.url });
  } catch (err) {
    console.error("[create-checkout]", err);
    return NextResponse.json(
      { error: "Kunde inte skapa betalningssession." },
      { status: 500 }
    );
  }
}
