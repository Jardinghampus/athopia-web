import { Webhook } from "svix";
import { NextResponse } from "next/server";
import type { WebhookEvent } from "@clerk/nextjs/server";
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

  if (event.type === "user.created") {
    const { id: clerkUserId } = event.data;
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

    // Skapa dagens usage-rad (free-tier räknare startar på 0)
    await supabase.from("user_feed_usage").upsert(
      { clerk_user_id: clerkUserId, date: new Date().toISOString().split("T")[0], items_seen: 0 },
      { onConflict: "clerk_user_id,date" }
    );

    console.log(`[clerk-webhook] user_feed_config skapad för ${clerkUserId}`);
  }

  return NextResponse.json({ received: true });
}
