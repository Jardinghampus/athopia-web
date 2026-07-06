import { auth } from "@clerk/nextjs/server";
import { createServerClient, isSupabaseConfigured } from "@/lib/supabase";
import { getPrimaryTeam } from "@/lib/team/getPrimaryTeam";
import { interestsToNewsTags } from "@/lib/feed/content-preferences";

export interface UserFeedPreferences {
  contentTypes: string[];
  newsTags: string[] | null;
  favoriteTeamSlug: string | null;
  favoriteTeamName: string | null;
}

const EMPTY: UserFeedPreferences = {
  contentTypes: [],
  newsTags: null,
  favoriteTeamSlug: null,
  favoriteTeamName: null,
};

/** Läser user_feed_config + favoritlag för personaliserade defaults. */
export async function getUserFeedPreferences(): Promise<UserFeedPreferences> {
  const { userId } = await auth();
  if (!userId || !isSupabaseConfigured()) return EMPTY;

  const [primaryTeam, configResult] = await Promise.all([
    getPrimaryTeam(),
    createServerClient()
      .from("user_feed_config")
      .select("content_types")
      .eq("clerk_user_id", userId)
      .eq("sport", "football")
      .maybeSingle(),
  ]);

  const contentTypes = (configResult.data?.content_types as string[] | null) ?? [];

  return {
    contentTypes,
    newsTags: interestsToNewsTags(contentTypes),
    favoriteTeamSlug: primaryTeam?.slug ?? null,
    favoriteTeamName: primaryTeam?.name ?? null,
  };
}
