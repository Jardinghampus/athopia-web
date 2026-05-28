import { NextResponse } from "next/server";
import { createServerClient, isSupabaseConfigured } from "@/lib/supabase";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const q = (searchParams.get("q") ?? "").trim();
  if (!q) return NextResponse.json({ articles: [], teams: [], players: [], podcasts: [] });
  if (!isSupabaseConfigured()) return NextResponse.json({ articles: [], teams: [], players: [], podcasts: [] });

  try {
    const supabase = createServerClient();

    const [{ data: articles }, { data: teams }, { data: players }, { data: podcasts }] = await Promise.all([
      supabase.from("articles").select("id,slug,title").ilike("title", `%${q}%`).limit(6),
      supabase.from("teams").select("id,slug,name").ilike("name", `%${q}%`).limit(6),
      supabase.from("players").select("id,slug,name").ilike("name", `%${q}%`).limit(6),
      supabase.from("podcast_episodes").select("id,title").ilike("title", `%${q}%`).limit(6),
    ]);

    return NextResponse.json({
      articles: articles ?? [],
      teams: teams ?? [],
      players: players ?? [],
      podcasts: podcasts ?? [],
    });
  } catch (e) {
    console.error("[search]", e);
    return NextResponse.json({ articles: [], teams: [], players: [], podcasts: [] });
  }
}

