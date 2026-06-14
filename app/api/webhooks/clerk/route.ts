import { Webhook } from "svix";
import { NextResponse } from "next/server";
import type { WebhookEvent } from "@clerk/nextjs/server";
import { clerkClient } from "@clerk/nextjs/server";
import Stripe from "stripe";
import { createServiceClient } from "@/lib/supabase";

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
  function mirrorProfile(data: WebhookEvent["data"]) {
    const d = data as {
      id: string;
      first_name?: string | null;
      last_name?: string | null;
      image_url?: string | null;
    };
    const supabase = createServiceClient();
    const display = [d.first_name, d.last_name].filter(Boolean).join(" ") || null;
    return supabase.from("profiles").upsert(
      { clerk_user_id: d.id, display_name: display, avatar_url: d.image_url ?? null },
      { onConflict: "clerk_user_id" }
    );
  }

  if (event.type === "user.created") {
    const { id: clerkUserId } = event.data;
    const email = (event.data as { email_addresses?: { email_address: string }[] })
      .email_addresses?.[0]?.email_address;
    const d = event.data as { first_name?: string | null; last_name?: string | null };

    // Skapa Stripe Customer och spara ID i Clerk privateMetadata
    if (process.env.STRIPE_SECRET_KEY) {
      try {
        const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
          apiVersion: "2026-04-22.dahlia",
        });
        const customer = await stripe.customers.create({
          email,
          name: [d.first_name, d.last_name].filter(Boolean).join(" ") || undefined,
          metadata: { clerkUserId },
        });
        const clerk = await clerkClient();
        await clerk.users.updateUserMetadata(clerkUserId, {
          privateMetadata: { stripeCustomerId: customer.id },
        });
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

    console.log(`[clerk-webhook] user_feed_config + profil skapad för ${clerkUserId}`);
  }

  if (event.type === "user.updated") {
    await mirrorProfile(event.data);
  }

  return NextResponse.json({ received: true });
}
