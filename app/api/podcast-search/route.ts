import { NextResponse } from "next/server";
import { createServerClient, isSupabaseConfigured } from "@/lib/supabase";
import { enforceRateLimit } from "@/lib/ratelimit";
import { listenMetaFromRow } from "@/lib/podcast/spotify";

/** Sök poddavsnitt — returnerar metadata only (ingen chunk-text). */
export async function GET(req: Request) {
  const blocked = await enforceRateLimit("search", req);
  if (blocked) return blocked;

  const { searchParams } = new URL(req.url);
  const q = (searchParams.get("q") ?? "").trim().slice(0, 100);
  if (!q) return NextResponse.json({ episodes: [] });
  if (!isSupabaseConfigured()) return NextResponse.json({ episodes: [] });

  try {
    const supabase = createServerClient();

    const { data: episodes } = await supabase
      .from("podcasts")
      .select("id, title, show_name, published_at, mentioned_teams, metadata")
      .or(`title.ilike.%${q}%,show_name.ilike.%${q}%`)
      .order("published_at", { ascending: false })
      .limit(10);

    const safe = (episodes ?? []).map((ep) => {
      const meta = (ep.metadata ?? {}) as Record<string, unknown>;
      const listen = listenMetaFromRow(meta);
      return {
        id: ep.id,
        title: ep.title,
        showName: ep.show_name,
        publishedAt: ep.published_at,
        mentionedTeams: ep.mentioned_teams ?? [],
        topics: Array.isArray(meta.topics) ? meta.topics : [],
        listenUrl: listen.listenUrl,
        spotifyEpisodeId: listen.spotifyEpisodeId,
      };
    });

    return NextResponse.json({ episodes: safe });
  } catch (e) {
    console.error("[podcast-search]", e);
    return NextResponse.json({ episodes: [] });
  }
}
