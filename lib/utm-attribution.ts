/**
 * Social growth attribution — write utm_events milestones.
 * Cookie `athopia_utm` is set by proxy.ts when ?utm_campaign= is present.
 * Idempotent per (campaign, event, clerk_user_id) where unique indexes apply.
 */
import { cookies } from "next/headers";
import { createServiceClient } from "@/lib/supabase";

export const UTM_CAMPAIGN_RE = /^[a-z0-9_-]{3,64}$/;

export type UtmMilestone =
  | "signup"
  | "team_selected"
  | "activated"
  | "trial_start";

export async function readUtmCampaignFromCookie(): Promise<string | null> {
  try {
    const store = await cookies();
    const campaign = store.get("athopia_utm")?.value;
    if (!campaign || !UTM_CAMPAIGN_RE.test(campaign)) return null;
    return campaign;
  } catch {
    return null;
  }
}

/**
 * Resolve campaign for an attributed user: cookie first, else last signup/visit
 * campaign already stored for this user (covers Stripe webhooks with no cookie).
 */
async function resolveCampaign(
  clerkUserId: string,
  explicit?: string | null,
  skipCookie = false,
): Promise<string | null> {
  if (explicit && UTM_CAMPAIGN_RE.test(explicit)) return explicit;

  if (!skipCookie) {
    const fromCookie = await readUtmCampaignFromCookie();
    if (fromCookie) return fromCookie;
  }

  try {
    const supabase = createServiceClient();
    const { data } = await supabase
      .from("utm_events")
      .select("campaign")
      .eq("clerk_user_id", clerkUserId)
      .in("event", ["signup", "team_selected", "visit"])
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    const campaign = data?.campaign as string | undefined;
    if (campaign && UTM_CAMPAIGN_RE.test(campaign)) return campaign;
  } catch (err) {
    console.error("[utm-attribution] resolveCampaign:", err);
  }
  return null;
}

export async function recordUtmMilestone(opts: {
  event: UtmMilestone;
  clerkUserId: string;
  path?: string | null;
  campaign?: string | null;
  sourceTeaserId?: string | null;
  properties?: Record<string, unknown>;
  /** Stripe/webhooks have no browser cookies — resolve from prior rows only. */
  skipCookie?: boolean;
}): Promise<boolean> {
  const {
    event,
    clerkUserId,
    path = null,
    sourceTeaserId = null,
    properties = {},
    skipCookie = false,
  } = opts;
  if (!clerkUserId) return false;

  const campaign = await resolveCampaign(clerkUserId, opts.campaign, skipCookie);
  if (!campaign) return false;

  try {
    const supabase = createServiceClient();

    const { data: existing } = await supabase
      .from("utm_events")
      .select("id")
      .eq("clerk_user_id", clerkUserId)
      .eq("event", event)
      .eq("campaign", campaign)
      .maybeSingle();
    if (existing) return false;

    // Global once for signup/trial_start (unique index on event+user)
    if (event === "signup" || event === "trial_start") {
      const { data: globalExisting } = await supabase
        .from("utm_events")
        .select("id")
        .eq("clerk_user_id", clerkUserId)
        .eq("event", event)
        .maybeSingle();
      if (globalExisting) return false;
    }

    const row: Record<string, unknown> = {
      campaign,
      path,
      event,
      clerk_user_id: clerkUserId,
      properties,
    };
    if (sourceTeaserId) row.source_teaser_id = sourceTeaserId;

    const { error } = await supabase.from("utm_events").insert(row);
    if (error) {
      // Unique violation = already recorded
      if (error.code === "23505") return false;
      console.error(`[utm-attribution] ${event} insert:`, error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.error(`[utm-attribution] ${event}:`, err);
    return false;
  }
}
