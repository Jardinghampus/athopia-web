import { getTeamBySlug, getTeamNews, getTeamThreads, getStandings, getTeamStats } from '@/lib/dashboard/queries'
import { NewsCard } from './cards/news-card'
import { ForumCard } from './cards/forum-card'
import { StatsCard } from './cards/stats-card'
import { StandingsCard } from './cards/standings-card'

export async function DashboardGrid({ teamSlug }: { teamSlug: string }) {
  const team = await getTeamBySlug(teamSlug)
  if (!team) {
    return (
      <p className="py-12 text-center text-sm text-muted-foreground">
        Lag hittades inte.
      </p>
    )
  }

  const [news, threads, standings, stats] = await Promise.all([
    getTeamNews(team.slug),
    getTeamThreads(team.id),
    getStandings(),
    getTeamStats(team.id),
  ])

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
      <NewsCard items={news} teamSlug={teamSlug} />
      <ForumCard threads={threads} teamSlug={teamSlug} />
      <StatsCard data={stats} teamSlug={teamSlug} />
      <StandingsCard rows={standings} activeTeamSlug={teamSlug} className="md:col-span-2 lg:col-span-3" />
    </div>
  )
}
