import "server-only";

import { createServerClient, isSupabaseConfigured } from "@/lib/supabase";

export async function getForumTeamSummary(teamSlug: string): Promise<string | null> {
  if (!isSupabaseConfigured()) return null;
  try {
    const { data } = await createServerClient()
      .from("agent_memory")
      .select("content")
      .eq("agent_id", "forum-summarizer")
      .eq("category", `forum_summary_${teamSlug}`)
      .maybeSingle();
    return (data?.content as string | undefined) ?? null;
  } catch {
    return null;
  }
}
