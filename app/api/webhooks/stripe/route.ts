/**
 * app/api/webhooks/stripe/route.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Stripe Webhook-handler för Athopia.
 *
 * Hanterar:
 *  - checkout.session.completed → sätter Clerk publicMetadata.plan='pro|elite'
 *  - customer.subscription.deleted → sätter plan='free'
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
import { logFunnelEvent } from "@/lib/funnel";
import { updatePlanSource } from "@/lib/entitlements";
import { recordAttributedEvent } from "@/lib/social-attribution";

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

      if (!session.metadata?.plan) {
        console.warn("[stripe-webhook] Saknar plan i session.metadata", session.id);
      }
      const plan = session.metadata?.plan === "elite" ? "elite" : "pro";

      await updatePlanSource(clerkUserId, "stripe", plan);
      await clerk.users.updateUserMetadata(clerkUserId, {
        privateMetadata: {
          stripeCustomerId: session.customer as string,
          stripeSubscriptionId: session.subscription as string,
        },
      });

      await logFunnelEvent("checkout_success", clerkUserId, { plan });

      console.log(`[stripe-webhook] ${plan.toUpperCase()} aktiverat för ${clerkUserId}`);
      break;
    }

    case "customer.subscription.created":
    case "customer.subscription.updated": {
      const subscription = event.data.object as Stripe.Subscription;
      const clerkUserId = subscription.metadata?.clerkUserId;
      if (!clerkUserId) break;

      const periodEndTs = (subscription as unknown as { current_period_end?: number }).current_period_end;
      const currentPeriodEnd = periodEndTs
        ? new Date(periodEndTs * 1000).toISOString()
        : undefined;

      if (
        subscription.status === "past_due" ||
        subscription.status === "unpaid" ||
        subscription.status === "canceled"
      ) {
        await updatePlanSource(clerkUserId, "stripe", "free");
        await clerk.users.updateUserMetadata(clerkUserId, {
          privateMetadata: {
            stripeCustomerId: subscription.customer as string,
            stripeSubscriptionId: subscription.id,
            subscription: {
              id: subscription.id,
              status: subscription.status,
              currentPeriodEnd,
              cancelAtPeriodEnd: subscription.cancel_at_period_end,
            },
          },
        });
      } else if (subscription.status === "active" || subscription.status === "trialing") {
        const plan = subscription.metadata?.plan === "elite" ? "elite" : "pro";
        await updatePlanSource(clerkUserId, "stripe", plan);
        await clerk.users.updateUserMetadata(clerkUserId, {
          privateMetadata: {
            stripeCustomerId: subscription.customer as string,
            stripeSubscriptionId: subscription.id,
            subscription: {
              id: subscription.id,
              status: subscription.status,
              plan,
              currentPeriodEnd,
              cancelAtPeriodEnd: subscription.cancel_at_period_end,
            },
          },
        });
        const previousStatus =
          event.type === "customer.subscription.updated"
            ? (
                event.data.previous_attributes as
                  | Partial<Stripe.Subscription>
                  | undefined
              )?.status
            : undefined;
        const enteredTrial =
          subscription.status === "trialing" &&
          (event.type === "customer.subscription.created" ||
            (previousStatus !== undefined && previousStatus !== "trialing"));
        if (enteredTrial) {
          await logFunnelEvent("trial_start", clerkUserId, { plan });
          await recordAttributedEvent({
            event: "trial_start",
            clerkUserId,
            path: "/api/webhooks/stripe",
            properties: { plan, subscription_id: subscription.id },
          });
        }
      }
      console.log(`[stripe-webhook] subscription.${event.type.split(".").pop()} för ${clerkUserId}`);
      break;
    }

    case "customer.subscription.deleted": {
      const subscription = event.data.object as Stripe.Subscription;
      const clerkUserId = subscription.metadata?.clerkUserId;

      if (!clerkUserId) {
        console.error("[stripe-webhook] Saknar clerkUserId i subscription", subscription.id);
        break;
      }

      await updatePlanSource(clerkUserId, "stripe", "free");
      await clerk.users.updateUserMetadata(clerkUserId, {
        privateMetadata: {
          stripeSubscriptionId: null,
          subscription: null,
        },
      });

      console.log(`[stripe-webhook] Prenumeration avbruten för ${clerkUserId}`);
      break;
    }

    default:
      // Ignorera övriga events
      break;
  }

  return NextResponse.json({ received: true });
}
