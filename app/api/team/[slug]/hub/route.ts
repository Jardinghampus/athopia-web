import { NextResponse } from "next/server";
import { getTeamHub } from "@/lib/team-hub/queries";
import { articlePublicPath } from "@/lib/provenance";
import { jsonContract } from "@/lib/api-contract";
import { TeamHubPayloadSchema } from "@/lib/api-schemas";

export const revalidate = 60;

/**
 * Publik lag-hub för gäst/Mitt lag (web) och native Mitt lag (iOS).
 *
 * Exponerar aldrig AI-body — bara titel/meta för nyheter. Pulse och
 * dailyEpisode är PRO-gatede och ingår därför INTE här.
 *
 * Wire-formatet är explicit camelCase och matchar `TeamHubPayloadSchema`.
 * getTeamHub() hämtar redan hela hubben, så supersetet kostar noll extra
 * DB-anrop.
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

  const fixture = (f: (typeof hub.recent)[number]) => ({
    sportsmonksId: f.sportmonks_id,
    homeTeamId: f.home_team_id,
    awayTeamId: f.away_team_id,
    homeTeamName: f.home_team_name,
    awayTeamName: f.away_team_name,
    homeScore: f.home_score,
    awayScore: f.away_score,
    kickoffAt: f.kickoff_at,
    status: f.status,
  });

  const leader = (l: (typeof hub.squad)[number]) => ({
    playerId: l.player_id,
    fullname: l.fullname,
    slug: l.slug,
    image: l.image,
    position: l.position,
    goals: l.goals,
    assists: l.assists,
    appearances: l.appearances,
  });

  return jsonContract(TeamHubPayloadSchema, {
    team: {
      id: hub.team.id,
      name: hub.team.name,
      slug: hub.team.slug,
      logoUrl: hub.team.logo_url,
      sportsmonksId: hub.team.sportsmonks_id,
    },
    position: hub.position,
    stats: hub.stats
      ? {
          teamId: hub.stats.team_id,
          played: hub.stats.played,
          wins: hub.stats.wins,
          draws: hub.stats.draws,
          losses: hub.stats.losses,
          goalsFor: hub.stats.goals_for,
          goalsAgainst: hub.stats.goals_against,
          goalDiff: hub.stats.goal_diff,
          points: hub.stats.points,
          position: hub.stats.position,
          possession: hub.stats.possession,
          xgFor: hub.stats.xg_for,
          xgAgainst: hub.stats.xg_against,
        }
      : null,
    form: hub.form.slice(-5),
    radar: hub.radar,
    topScorers: hub.topScorers.map(leader),
    topAssists: hub.topAssists.map(leader),
    squad: hub.squad.map(leader),
    recent: hub.recent.map(fixture),
    upcoming: hub.upcoming.map(fixture),
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
      slug: n.slug,
      title: n.title,
      href: articlePublicPath({
        slug: n.slug,
        rights_status: n.rights_status,
      }),
      publishedAt: n.published_at,
      // DashArticle bär ingen källa i hub-queryn — null döljer fältet i klienten.
      sourceName: null,
    })),
    threads: hub.threads.slice(0, 4).map((t) => ({
      id: t.id,
      title: t.title,
      replyCount: t.reply_count,
      href: `/forum/${hub.team.slug}/${t.id}`,
      createdAt: t.created_at,
    })),
    guest: true,
  });
}
