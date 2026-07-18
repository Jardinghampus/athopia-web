import { createServerClient, isSupabaseConfigured } from "@/lib/supabase";
import { buildFeedModules } from "@/lib/feed/build-feed-modules";
import { FeedModulesRailClient } from "@/components/feed/FeedModulesRailClient";

/**
 * Server-directed Flöde modules (podd / snackis / tabell) — web parity with iOS Home.
 */
export async function FeedModulesRail() {
  if (!isSupabaseConfigured()) return null;
  const db = createServerClient();
  let modules: Awaited<ReturnType<typeof buildFeedModules>> = [];
  try {
    modules = await buildFeedModules(db);
  } catch {
    return null;
  }
  if (modules.length === 0) return null;

  return <FeedModulesRailClient modules={modules} />;
}
