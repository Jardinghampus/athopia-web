/**
 * app/api/webhooks/stripe/route.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Stripe Webhook-handler för Athopia.
 *
 * Hanterar:
 *  - checkout.session.completed → sätter Clerk publicMetadata subscriptionTier='pro'
 *  - customer.subscription.deleted → sätter subscriptionTier='free'
 *
 * Beslut:
 * - Signaturverifiering via stripe.webhooks.constructEvent() – ALDRIG hoppa över.
 * - Clerk Admin SDK (clerkClient) används server-side för att uppdatera metadata.
 * - Raw body läses med req.text() (Next.js App Router kräver detta).
 * ─────────────────────────────────────────────────────────────────────────────
 */

import Stripe from "stripe";
import { NextResponse } from "next/server";
import { clerkClient } from "@clerk/nextjs/server";

// Lazy — initieras i POST() för att undvika build-time env-fel;

export async function POST(req: Request) {
  // Lazy-init för att undvika build-time krav på env-vars
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: "2026-04-22.dahlia",
  });
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

  const body = await req.text();
  const signature = req.headers.get("stripe-signature");

  if (!signature) {
    return NextResponse.json({ error: "Saknar stripe-signature" }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (err) {
    console.error("[stripe-webhook] Signaturverifiering misslyckades:", err);
    return NextResponse.json(
      { error: "Ogiltig webhook-signatur" },
      { status: 400 }
    );
  }

  const clerk = await clerkClient();

  // ─── Hantera events ────────────────────────────────────────────────────────
  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session;
      const clerkUserId =
        session.client_reference_id ??
        (session.metadata?.clerkUserId as string | undefined);

      if (!clerkUserId) {
        console.error("[stripe-webhook] Saknar clerkUserId i session", session.id);
        break;
      }

      await clerk.users.updateUserMetadata(clerkUserId, {
        publicMetadata: {
          subscriptionTier: "pro",
          stripeCustomerId: session.customer as string,
          stripeSubscriptionId: session.subscription as string,
        },
      });

      console.log(`[stripe-webhook] PRO aktiverat för ${clerkUserId}`);
      break;
    }

    case "customer.subscription.deleted": {
      const subscription = event.data.object as Stripe.Subscription;
      const clerkUserId = subscription.metadata?.clerkUserId;

      if (!clerkUserId) {
        // Fallback: sök via stripeCustomerId om metadata saknas
        console.error("[stripe-webhook] Saknar clerkUserId i subscription", subscription.id);
        break;
      }

      await clerk.users.updateUserMetadata(clerkUserId, {
        publicMetadata: {
          subscriptionTier: "free",
          stripeSubscriptionId: null,
        },
      });

      console.log(`[stripe-webhook] Prenumeration avbruten för ${clerkUserId}`);
      break;
    }

    case "customer.subscription.updated": {
      // Hantera pauser, status-ändringar etc om nödvändigt
      const subscription = event.data.object as Stripe.Subscription;
      if (subscription.status === "past_due" || subscription.status === "unpaid") {
        const clerkUserId = subscription.metadata?.clerkUserId;
        if (clerkUserId) {
          await clerk.users.updateUserMetadata(clerkUserId, {
            publicMetadata: { subscriptionTier: "free" },
          });
        }
      }
      break;
    }

    default:
      // Ignorera övriga events
      break;
  }

  return NextResponse.json({ received: true });
}
