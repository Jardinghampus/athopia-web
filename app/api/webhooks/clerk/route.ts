import { Webhook } from "svix";
import { NextResponse } from "next/server";
import type { WebhookEvent } from "@clerk/nextjs/server";
import { clerkClient } from "@clerk/nextjs/server";
import Stripe from "stripe";
import { createServiceClient } from "@/lib/supabase";
import { logFunnelEvent } from "@/lib/funnel";

export async function POST(req: Request) {
  const webhookSecret = process.env.CLERK_WEBHOOK_SECRET;
  if (!webhookSecret) {
    console.error("[clerk-webhook] CLERK_WEBHOOK_SECRET saknas");
    return NextResponse.json({ error: "Konfigurationsfel" }, { status: 500 });
  }

  const body = await req.text();
  const svixId        = req.headers.get("svix-id") ?? "";
  const svixTimestamp = req.headers.get("svix-timestamp") ?? "";
  const svixSignature = req.headers.get("svix-signature") ?? "";

  let event: WebhookEvent;
  try {
    const wh = new Webhook(webhookSecret);
    event = wh.verify(body, {
      "svix-id":        svixId,
      "svix-timestamp": svixTimestamp,
      "svix-signature": svixSignature,
    }) as WebhookEvent;
  } catch (err) {
    console.error("[clerk-webhook] Signaturverifiering misslyckades:", err);
    return NextResponse.json({ error: "Ogiltig signatur" }, { status: 400 });
  }

  // Spegla publika profilfält till profiles (display_name + avatar) — bevarar
  // nickname/bio/verified som sätts via /api/profile.
  async function mirrorProfile(data: WebhookEvent["data"]): Promise<void> {
    const d = data as {
      id: string;
      first_name?: string | null;
      last_name?: string | null;
      image_url?: string | null;
    };
    const supabase = createServiceClient();
    const display = [d.first_name, d.last_name].filter(Boolean).join(" ") || null;
    const { error } = await supabase.from("profiles").upsert(
      { clerk_user_id: d.id, display_name: display, avatar_url: d.image_url ?? null },
      { onConflict: "clerk_user_id" }
    );
    if (error) console.error("[clerk-webhook] mirrorProfile fel:", error.message);
  }

  if (event.type === "user.created") {
    const { id: clerkUserId } = event.data;
    const email = (event.data as { email_addresses?: { email_address: string }[] })
      .email_addresses?.[0]?.email_address;
    const d = event.data as { first_name?: string | null; last_name?: string | null };

    // Skapa Stripe Customer — kontrollera att det inte redan finns ett (idempotent vid retry)
    if (process.env.STRIPE_SECRET_KEY) {
      try {
        const clerk = await clerkClient();
        const existingUser = await clerk.users.getUser(clerkUserId);
        const existingCustomerId = existingUser.privateMetadata?.stripeCustomerId as string | undefined;

        if (!existingCustomerId) {
          const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
            apiVersion: "2026-04-22.dahlia",
          });
          const customer = await stripe.customers.create({
            email,
            name: [d.first_name, d.last_name].filter(Boolean).join(" ") || undefined,
            metadata: { clerkUserId },
          });
          await clerk.users.updateUserMetadata(clerkUserId, {
            privateMetadata: { stripeCustomerId: customer.id },
          });
        }
      } catch (err) {
        console.error("[clerk-webhook] Stripe customer creation failed:", err);
      }
    }

    const supabase = createServiceClient();

    const { error } = await supabase.from("user_feed_config").upsert(
      {
        clerk_user_id:   clerkUserId,
        sport:           "football",
        followed_team_ids: [],
        followed_leagues:  [],
        content_types:     [],
      },
      { onConflict: "clerk_user_id" }
    );

    if (error) {
      console.error("[clerk-webhook] Kunde inte skapa user_feed_config:", error);
      return NextResponse.json({ error: "DB-fel" }, { status: 500 });
    }

    await supabase.from("user_feed_usage").upsert(
      { clerk_user_id: clerkUserId, date: new Date().toISOString().split("T")[0], items_seen: 0 },
      { onConflict: "clerk_user_id,date" }
    );
    await mirrorProfile(event.data);

    await logFunnelEvent("signup_complete", clerkUserId);

    console.log(`[clerk-webhook] user_feed_config + profil skapad för ${clerkUserId}`);
  }

  if (event.type === "user.updated") {
    await mirrorProfile(event.data);
  }

  // GDPR: rätt att bli glömd. Radera/anonymisera all PII när kontot tas bort.
  if (event.type === "user.deleted") {
    const clerkUserId = (event.data as { id?: string }).id;
    if (!clerkUserId) return NextResponse.json({ received: true });

    const supabase = createServiceClient();
    const { error: deletionError } = await supabase.rpc("delete_user_account", {
      p_clerk_user_id: clerkUserId,
    });
    if (deletionError) {
      console.error("[clerk-webhook] delete_user_account:", deletionError);
      return NextResponse.json(
        { error: "Account deletion failed", code: "deletion_failed" },
        { status: 500 },
      );
    }

    let stripeFailed = false;
    // Radera Stripe-kund (om den finns) — tar med abonnemang och betalnings-PII.
    if (process.env.STRIPE_SECRET_KEY) {
      try {
        const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: "2026-04-22.dahlia" });
        const customers = await stripe.customers.search({ query: `metadata['clerkUserId']:'${clerkUserId}'` });
        for (const c of customers.data) await stripe.customers.del(c.id);
      } catch (err) {
        stripeFailed = true;
        console.error("[clerk-webhook] Stripe customer deletion failed:", err);
      }
    }

    if (stripeFailed) {
      return NextResponse.json(
        { error: "Stripe deletion failed", code: "stripe_deletion_failed" },
        { status: 500 },
      );
    }

    console.log(`[clerk-webhook] GDPR-radering klar för ${clerkUserId}`);
  }

  return NextResponse.json({ received: true });
}
