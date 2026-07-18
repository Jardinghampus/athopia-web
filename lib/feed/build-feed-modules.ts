/**
 * Server-directed Home feed modules (B-05).
 * Client owns rendering; server owns type/order/content.
 */
import type { SupabaseClient } from "@supabase/supabase-js";
import type { z } from "zod";
import type { FeedModuleSchema } from "@/lib/api-schemas";
import { fetchStandingsFull } from "@/lib/db/fixtures";
import { listenMetaFromRow } from "@/lib/podcast/spotify";

export type FeedModule = z.infer<typeof FeedModuleSchema>;

const SPORT = "football";

export async function buildFeedModules(
  db: SupabaseClient,
): Promise<FeedModule[]> {
  const modules: FeedModule[] = [];

  const [podcastRes, forumRes, standings] = await Promise.all([
    db
      .from("podcasts")
      .select(
        "id, title, show_name, published_at, metadata, audio_url, rss_sources!inner(sport)",
      )
      .eq("rss_sources.sport", SPORT)
      .order("published_at", { ascending: false, nullsFirst: false })
      .limit(1)
      .maybeSingle(),
    db
      .from("forum_posts")
      .select(
        "id, content, author_name, team_slug, like_count, reply_count, created_at, hot_score, depth",
      )
      .eq("sport", SPORT)
      .eq("status", "published")
      .eq("depth", 0)
      .order("hot_score", { ascending: false, nullsFirst: false })
      .limit(1)
      .maybeSingle(),
    fetchStandingsFull().catch(() => []),
  ]);

  if (podcastRes.data && !podcastRes.error) {
    const p = podcastRes.data as {
      id: string;
      title: string;
      show_name: string | null;
      published_at: string | null;
      metadata: Record<string, unknown> | null;
      audio_url: string | null;
    };
    const listen = listenMetaFromRow(p.metadata, null, p.audio_url);
    const listenUrl = listen.spotifyEpisodeId
      ? `https://open.spotify.com/episode/${listen.spotifyEpisodeId}`
      : listen.spotifyShowId
        ? `https://open.spotify.com/show/${listen.spotifyShowId}`
        : listen.listenUrl;
    modules.push({
      id: `mod_podcast_${p.id}`,
      type: "podcast",
      schemaVersion: 1,
      tracking: { reason: "latest_podcast", position: 4 },
      payload: {
        id: p.id,
        title: p.title,
        showName: p.show_name ?? "Podcast",
        publishedAt: p.published_at,
        listenUrl,
        spotifyEpisodeId: listen.spotifyEpisodeId,
      },
    });
  }

  if (forumRes.data && !forumRes.error) {
    const t = forumRes.data as {
      id: string;
      content: string;
      author_name: string | null;
      team_slug: string | null;
      like_count: number | null;
      reply_count: number | null;
      created_at: string | null;
    };
    const snippet = t.content.trim();
    const title =
      snippet.split("\n")[0]?.slice(0, 120) || "Diskussion";
    modules.push({
      id: `mod_discussion_${t.id}`,
      type: "discussion",
      schemaVersion: 1,
      tracking: { reason: "hot_thread", position: 8 },
      payload: {
        id: t.id,
        title,
        body: snippet.slice(0, 240),
        authorName: t.author_name,
        teamSlug: t.team_slug,
        likeCount: t.like_count ?? 0,
        replyCount: t.reply_count ?? 0,
        createdAt: t.created_at,
      },
    });
  }

  if (standings.length > 0) {
    modules.push({
      id: "mod_standings_top",
      type: "standings_snapshot",
      schemaVersion: 1,
      tracking: { reason: "league_pulse", position: 12 },
      payload: {
        rows: standings.slice(0, 3).map((r) => ({
          position: r.position,
          teamName: r.team.name,
          teamSlug: r.team.slug,
          played: r.played,
          points: r.points,
          goalDifference: r.goals_for - r.goals_against,
        })),
      },
    });
  }

  return modules;
}
