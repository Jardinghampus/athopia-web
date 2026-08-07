import { createServerClient, isSupabaseConfigured } from "@/lib/supabase";

export interface FeedTeamOption {
  name: string;
  slug: string;
}

/**
 * De 16 Allsvenskan-klubbarna för filterpanelen på /nyheter. `entities`
 * (type='team') är den kanoniska källan — slug kommer alltid därifrån,
 * aldrig ad-hoc slugify (se lib/team-names.ts för samma princip).
 */
export async function getAllsvenskanTeams(): Promise<FeedTeamOption[]> {
  if (!isSupabaseConfigured()) return [];
  try {
    const db = createServerClient();
    const { data } = await db
      .from("entities")
      .select("name, slug")
      .eq("type", "team")
      .not("slug", "is", null)
      .order("name", { ascending: true });
    return (data ?? [])
      .filter((r: { name: unknown; slug: unknown }) => r.name && r.slug)
      .map((r: { name: unknown; slug: unknown }) => ({
        name: String(r.name),
        slug: String(r.slug),
      }));
  } catch {
    return [];
  }
}
