import { Webhook } from "svix";
import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase";
import { logFunnelEvent } from "@/lib/funnel";
import {
  isUniqueViolation,
  mapBeehiivEvent,
  redactWebhookPayload,
  webhookObjectIds,
} from "@/lib/newsletter/schema";

interface BeehiivWebhookBody {
  type?: string;
  event_type?: string;
  data?: Record<string, unknown>;
}

export async function POST(req: Request) {
  const secret = process.env.BEEHIIV_WEBHOOK_SECRET;
  if (!secret) {
    console.error("[beehiiv-webhook] secret missing");
    return NextResponse.json({ error: "Konfigurationsfel" }, { status: 500 });
  }

  const rawBody = await req.text();
  const svixId = req.headers.get("svix-id") ?? "";
  const svixTimestamp = req.headers.get("svix-timestamp") ?? "";
  const svixSignature = req.headers.get("svix-signature") ?? "";
  let event: BeehiivWebhookBody;
  try {
    event = new Webhook(secret).verify(rawBody, {
      "svix-id": svixId,
      "svix-timestamp": svixTimestamp,
      "svix-signature": svixSignature,
    }) as BeehiivWebhookBody;
  } catch {
    console.warn("[beehiiv-webhook] invalid signature");
    return NextResponse.json({ error: "Ogiltig signatur" }, { status: 400 });
  }

  const eventType = event.type ?? event.event_type ?? "unknown";
  const data =
    event.data && typeof event.data === "object" ? event.data : {};
  const ids = webhookObjectIds(data);
  const db = createServiceClient();
  const minimalPayload = redactWebhookPayload(eventType, data);
  const { error: insertError } = await db
    .from("newsletter_webhook_events")
    .insert({
      provider_event_id: svixId,
      event_type: eventType,
      provider_object_id: ids.subscriptionId ?? ids.postId,
      payload: minimalPayload,
      status: "received",
    });

  if (insertError && !isUniqueViolation(insertError)) {
    console.error("[beehiiv-webhook] event storage failed", insertError.message);
    return NextResponse.json({ error: "DB-fel" }, { status: 500 });
  }
  if (isUniqueViolation(insertError)) {
    const { data: existing, error } = await db
      .from("newsletter_webhook_events")
      .select("status")
      .eq("provider_event_id", svixId)
      .single();
    if (error) {
      console.error("[beehiiv-webhook] idempotency lookup failed", error.message);
      return NextResponse.json({ error: "DB-fel" }, { status: 500 });
    }
    if (existing.status === "processed" || existing.status === "ignored") {
      return NextResponse.json({ received: true, duplicate: true });
    }
  }

  const action = mapBeehiivEvent(eventType, data.status);
  let finalStatus: "processed" | "ignored" = "ignored";
  try {
    if (action.kind === "subscriber" && action.status && ids.subscriptionId) {
      const now = new Date().toISOString();
      const { error } = action.deleteLocal
        ? await db
            .from("newsletter_subscribers")
            .delete()
            .eq("beehiiv_subscription_id", ids.subscriptionId)
        : await db
            .from("newsletter_subscribers")
            .update({
              status: action.status,
              sync_status: "synced",
              last_sync_error: null,
              last_synced_at: now,
              ...(action.status === "active"
                ? { confirmed_at: now, unsubscribed_at: null }
                : {}),
              ...(action.status === "unsubscribed"
                ? { unsubscribed_at: now }
                : {}),
            })
            .eq("beehiiv_subscription_id", ids.subscriptionId);
      if (error) throw new Error(error.message);
      if (action.status === "active") {
        await logFunnelEvent("newsletter_confirmed", null, {
          beehiiv_subscription_id: ids.subscriptionId,
        });
      }
      finalStatus = "processed";
    } else if (action.kind === "post" && ids.postId) {
      const now = new Date().toISOString();
      const nextMetricsSyncAt = new Date(
        Date.now() + 24 * 60 * 60 * 1000,
      ).toISOString();
      const { error } = await db
        .from("newsletter_deliveries")
        .update({
          state: action.postState === "scheduled" ? "scheduled" : "sent",
          ...(action.postState === "scheduled"
            ? { provider_scheduled_at: now }
            : {
                provider_sent_at: now,
                next_metrics_sync_at: nextMetricsSyncAt,
              }),
        })
        .eq("beehiiv_post_id", ids.postId);
      if (error) throw new Error(error.message);
      finalStatus = "processed";
    }

    const { error: completionError } = await db
      .from("newsletter_webhook_events")
      .update({
        status: finalStatus,
        processed_at: new Date().toISOString(),
        error: null,
      })
      .eq("provider_event_id", svixId);
    if (completionError) throw new Error(completionError.message);
  } catch (error) {
    const message = error instanceof Error ? error.message.slice(0, 500) : "unknown";
    await db
      .from("newsletter_webhook_events")
      .update({ status: "failed", error: message })
      .eq("provider_event_id", svixId);
    console.error("[beehiiv-webhook] processing failed", message);
    return NextResponse.json({ error: "Bearbetning misslyckades" }, { status: 500 });
  }

  return NextResponse.json({ received: true, status: finalStatus });
}
