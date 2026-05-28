import { NextResponse } from "next/server";
import { createServerClient, isSupabaseConfigured } from "@/lib/supabase";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const q = (searchParams.get("q") ?? "").trim();
  if (!q) return NextResponse.json({ episodes: [], chunks: [] });
  if (!isSupabaseConfigured()) return NextResponse.json({ episodes: [], chunks: [] });

  try {
    const supabase = createServerClient();

    // Placeholder: textsökning tills embedding-pipeline är klar.
    const { data: chunks } = await supabase
      .from("podcast_chunks")
      .select("podcast_id, start_seconds, end_seconds, text")
      .ilike("text", `%${q}%`)
      .limit(20);

    const podcastIds = Array.from(new Set((chunks ?? []).map((c: any) => c.podcast_id).filter(Boolean)));

    const { data: episodes } =
      podcastIds.length === 0
        ? { data: [] as any[] }
        : await supabase
            .from("podcast_episodes")
            .select("*")
            .in("id", podcastIds)
            .limit(10);

    return NextResponse.json({ episodes: episodes ?? [], chunks: chunks ?? [] });
  } catch (e) {
    console.error("[podcast-search]", e);
    return NextResponse.json({ episodes: [], chunks: [] });
  }
}

