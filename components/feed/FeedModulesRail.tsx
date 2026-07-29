import { auth } from "@clerk/nextjs/server";
import { FeedModulesRailClient } from "@/components/feed/FeedModulesRailClient";
import type { FeedModule } from "@/lib/feed/build-feed-modules";
import { buildFeedModules } from "@/lib/feed/build-feed-modules";
import { isFeedRankerV2Enabled } from "@/lib/feed/rank-feed-modules";
import { createServerClient, isSupabaseConfigured } from "@/lib/supabase";
import { getUserPlan } from "@/lib/user-plan";

/** Server-side check: feedback UI only renders when the flag is on AND the user opted in. */
async function getFeedbackUiEnabled(): Promise<boolean> {
  if (!isFeedRankerV2Enabled()) return false;
  if (!isSupabaseConfigured()) return false;
  try {
    const { userId } = await auth();
    if (!userId) return false;
    const db = createServerClient();
    const { data } = await db
      .from("user_feed_config")
      .select("personalization_enabled")
      .eq("clerk_user_id", userId)
      .eq("sport", "football")
      .maybeSingle();
    return data?.personalization_enabled === true;
  } catch {
    return false;
  }
}

/**
 * Server-directed Flöde modules — web parity with iOS Home.
 * Pass `modules` when the parent already built them (avoids a second fetch).
 */
export async function FeedModulesRail({
  modules: prebuilt,
}: {
  modules?: FeedModule[];
} = {}) {
  let modules = prebuilt ?? [];
  if (!prebuilt) {
    if (!isSupabaseConfigured()) return null;
    const db = createServerClient();
    try {
      const plan = await getUserPlan();
      modules = await buildFeedModules(db, { plan });
    } catch {
      return null;
    }
  }
  if (modules.length === 0) return null;

  const feedbackEnabled = await getFeedbackUiEnabled();

  return (
    <FeedModulesRailClient modules={modules} feedbackEnabled={feedbackEnabled} />
  );
}
