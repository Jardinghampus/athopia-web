import { createServerClient, isSupabaseConfigured } from "@/lib/supabase";
import { buildFeedModules } from "@/lib/feed/build-feed-modules";
import { FeedModulesRailClient } from "@/components/feed/FeedModulesRailClient";
import { getUserPlan } from "@/lib/user-plan";

/**
 * Server-directed Flöde modules — web parity with iOS Home.
 */
export async function FeedModulesRail() {
  if (!isSupabaseConfigured()) return null;
  const db = createServerClient();
  let modules: Awaited<ReturnType<typeof buildFeedModules>> = [];
  try {
    const plan = await getUserPlan();
    modules = await buildFeedModules(db, { plan });
  } catch {
    return null;
  }
  if (modules.length === 0) return null;

  return <FeedModulesRailClient modules={modules} />;
}
