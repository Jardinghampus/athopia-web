import { FeedModulesRailClient } from "@/components/feed/FeedModulesRailClient";
import type { FeedModule } from "@/lib/feed/build-feed-modules";
import { buildFeedModules } from "@/lib/feed/build-feed-modules";
import { createServerClient, isSupabaseConfigured } from "@/lib/supabase";
import { getUserPlan } from "@/lib/user-plan";

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

  return <FeedModulesRailClient modules={modules} />;
}
