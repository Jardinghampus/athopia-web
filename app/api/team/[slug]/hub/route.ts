import { NextResponse } from "next/server";
import { getTeamHub } from "@/lib/team-hub/queries";
import { articlePublicPath } from "@/lib/provenance";

export const revalidate = 60;

/**
 * Publik lag-hub preview för gäst/Mitt lag (LAUNCH-05).
 * Exponerar aldrig AI-body — bara titel/meta för nyheter.
 */
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;
  if (!slug || slug === "demo-if") {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  const hub = await getTeamHub(slug);
  if (!hub) return NextResponse.json({ error: "not_found" }, { status: 404 });

  const next = hub.upcoming[0] ?? null;
  const last = hub.recent[0] ?? null;

  return NextResponse.json({
    team: {
      id: hub.team.id,
      name: hub.team.name,
      slug: hub.team.slug,
      logoUrl: hub.team.logo_url,
    },
    position: hub.position,
    form: hub.form.slice(-5),
    points: hub.stats?.points ?? null,
    played: hub.stats?.played ?? null,
    nextMatch: next
      ? {
          id: next.sportmonks_id,
          home: next.home_team_name,
          away: next.away_team_name,
          kickoffAt: next.kickoff_at,
          status: next.status,
        }
      : null,
    lastMatch: last
      ? {
          id: last.sportmonks_id,
          home: last.home_team_name,
          away: last.away_team_name,
          homeScore: last.home_score,
          awayScore: last.away_score,
          kickoffAt: last.kickoff_at,
        }
      : null,
    news: hub.news.slice(0, 5).map((n) => ({
      id: n.id,
      title: n.title,
      href: articlePublicPath({
        slug: n.slug,
        rights_status: n.rights_status,
      }),
      publishedAt: n.published_at,
    })),
    threads: hub.threads.slice(0, 4).map((t) => ({
      id: t.id,
      title: t.title,
      replyCount: t.reply_count,
      href: `/forum/${hub.team.slug}/${t.id}`,
    })),
    guest: true,
  });
}
