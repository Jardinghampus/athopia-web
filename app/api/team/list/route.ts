import { NextResponse } from "next/server";
import { createServerClient, isSupabaseConfigured } from "@/lib/supabase";
import { MOCK_TEAM_LIST_ITEM } from "@/lib/team-hub/mock";

export const dynamic = "force-dynamic";

export async function GET() {
  if (!isSupabaseConfigured()) return NextResponse.json({ teams: [MOCK_TEAM_LIST_ITEM] });
  try {
    const db = createServerClient();
    const { data } = await db.from("entities").select("name,slug,metadata").eq("type", "team").order("name");
    const teams = (data ?? [])
      .filter((t) => t.slug)
      .map((t) => {
        const meta = (t.metadata ?? {}) as Record<string, unknown>;
        return { name: String(t.name), slug: String(t.slug), logo_url: (meta.logo_url as string | null) ?? null };
      });
    return NextResponse.json({ teams: [MOCK_TEAM_LIST_ITEM, ...teams] }, { headers: { "Cache-Control": "s-maxage=600, stale-while-revalidate=1200" } });
  } catch {
    return NextResponse.json({ teams: [MOCK_TEAM_LIST_ITEM] }, { status: 500 });
  }
}
