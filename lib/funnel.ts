import { createServiceClient } from "@/lib/supabase";

/**
 * Funnel-events för aktivering→PRO-konvertering (PRD: aktivering-pro-konvertering).
 * Klient-sidan skickar via /api/analytics/event; server-sidan via logFunnelEvent().
 */
export const FUNNEL_EVENTS = [
  "landing_view",
  "signup_complete",
  "onboarding_team_selected",
  "onboarding_complete",
  "feed_first_view",
  "paywall_view",
  "checkout_start",
  "checkout_success",
  "push_opt_in",
] as const;

export type FunnelEvent = (typeof FUNNEL_EVENTS)[number];

/** Server-side logging — samma agent_logs-väg som /api/analytics/event. Får aldrig kasta. */
export async function logFunnelEvent(
  event: FunnelEvent,
  clerkUserId: string | null,
  props?: Record<string, string | number | boolean | null>
): Promise<void> {
  try {
    const db = createServiceClient();
    await db.from("agent_logs").insert({
      agent_name: "web-funnel",
      action: event,
      level: "info",
      message: event,
      kind: "product_event",
      payload: { ...(props ?? {}), clerk_user_id: clerkUserId ?? "anon" },
    });
  } catch {
    // Analytics får aldrig blockera flödet
  }
}
