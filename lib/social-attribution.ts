import { cookies } from "next/headers";
import * as Sentry from "@sentry/nextjs";
import { createServiceClient } from "@/lib/supabase";

export const ATTRIBUTION_EVENTS = [
  "signup",
  "team_selected",
  "activated",
  "trial_start",
] as const;
export type AttributionEvent = (typeof ATTRIBUTION_EVENTS)[number];

const UTM_CAMPAIGN_RE = /^[a-z0-9_-]{3,64}$/;

export async function recordAttributedEvent(options: {
  event: AttributionEvent;
  clerkUserId: string;
  path: string;
  properties?: Record<string, string | number | boolean | null>;
}): Promise<void> {
  const correlationId = crypto.randomUUID();
  try {
    const jar = await cookies();
    let campaign = jar.get("athopia_utm")?.value;
    const sessionId = jar.get("athopia_attribution_session")?.value ?? null;
    const db = createServiceClient();

    if (!campaign || !UTM_CAMPAIGN_RE.test(campaign)) {
      const { data: previous } = await db
        .from("utm_events")
        .select("campaign")
        .eq("clerk_user_id", options.clerkUserId)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      campaign = previous?.campaign;
    }
    if (!campaign || !UTM_CAMPAIGN_RE.test(campaign)) return;

    const { error } = await db.from("utm_events").insert({
      campaign,
      path: options.path.slice(0, 500),
      event: options.event,
      clerk_user_id: options.clerkUserId,
      session_id: sessionId,
      properties: {
        ...(options.properties ?? {}),
        correlation_id: correlationId,
      },
    });
    // Unique funnel events are intentionally idempotent.
    if (error && error.code !== "23505") throw error;
  } catch (error) {
    Sentry.captureException(error, {
      tags: { subsystem: "social-attribution", event: options.event },
      extra: { correlationId, clerkUserId: options.clerkUserId },
    });
    console.error(`[social-attribution:${correlationId}]`, error);
  }
}
