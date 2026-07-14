import type { Tool } from 'ai'
import { z } from 'zod'
import { createClient } from '@supabase/supabase-js'
import { searchArticles } from './embedding'
import { resolveTeam } from './resolve'
import { getTeamNameMap } from '@/lib/team-names'

const SEASON_ID = Number(process.env.SPORTSMONKS_SEASON_ID_2026 ?? '26806')

function getDb() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
}

// ponytail: cast to Record<string, Tool> — ai@7 tool() helper is UI-only; server tools are plain objects
export const tools: Record<string, Tool> = {
  getRecentNews: {
    description: 'Hämta senaste nyheter från idag och igår om Allsvenskan, lag eller spelare. Använd alltid detta verktyg när användaren frågar om nyheter, senaste händelser eller vill ha en sammanfattning.',
    inputSchema: z.object({ keyword: z.string().optional().describe('Lagnamn eller spelares namn att filtrera på') }),
    execute: async ({ keyword }: { keyword?: string }) => {
      try {
        const db = getDb()
        const since = new Date()
        since.setDate(since.getDate() - 2) // senaste 48h
        let q = db
          .from('content_queue')
          .select('title,source_name,source_url,published_at')
          .eq('sport', 'football')
          .gte('published_at', since.toISOString())
          .order('published_at', { ascending: false })
          .limit(15)
        if (keyword) q = q.ilike('title', `%${keyword}%`)
        const { data } = await q
        if (!data?.length) {
          // Fallback: last 7 days
          const { data: fallback } = await db
            .from('content_queue')
            .select('title,source_name,source_url,published_at')
            .eq('sport', 'football')
            .ilike('title', keyword ? `%${keyword}%` : '%')
            .order('published_at', { ascending: false })
            .limit(10)
          if (!fallback?.length) return { news: [], message: 'Inga nyheter hittades.' }
          return { news: fallback }
        }
        return { news: data, today: new Date().toLocaleDateString('sv-SE') }
      } catch (e) {
        return { error: String(e) }
      }
    },
  },

  searchNews: {
    description: 'Sök djupare i artikelarkivet med semantisk sökning. Använd när getRecentNews inte räcker.',
    inputSchema: z.object({ query: z.string() }),
    execute: async ({ query }: { query: string }) => {
      try {
        const results = await searchArticles(query, 5)
        if (!results.length) return { results: [], message: 'Inga artiklar hittades.' }
        return { results: results.map((r) => ({ title: r.title, url: r.url, excerpt: r.chunk.slice(0, 300) })) }
      } catch {
        return { results: [], message: 'Artikelsökning tillfälligt otillgänglig.' }
      }
    },
  },

  getStandings: {
    description: 'Hämta aktuell tabellställning i Allsvenskan 2026.',
    inputSchema: z.object({ league: z.string().optional() }),
    execute: async (_args: { league?: string }) => {
      try {
        const db = getDb()
        const { data: stats } = await db
          .from('team_season_stats')
          .select('team_id,played,wins,draws,losses,points,goals_for,goals_against,form')
          .eq('season_id', SEASON_ID)
          .order('points', { ascending: false })
          .order('goals_for', { ascending: false })
        if (!stats?.length) return { error: 'Tabelldata saknas.' }

        const nm = await getTeamNameMap(db, stats.map(r => r.team_id))

        return {
          season: 'Allsvenskan 2026',
          standings: stats.map((r, i) => ({
            pos: i + 1,
            team: nm.get(r.team_id)?.name || `Lag ${r.team_id}`,
            played: r.played,
            points: r.points,
            wins: r.wins,
            draws: r.draws,
            losses: r.losses,
            gd: (r.goals_for ?? 0) - (r.goals_against ?? 0),
            form: r.form,
          })),
        }
      } catch (e) {
        return { error: String(e) }
      }
    },
  },

  getTeamStats: {
    description: 'Hämta detaljerad statistik och toppspelare för ett lag i Allsvenskan 2026.',
    inputSchema: z.object({ team: z.string() }),
    execute: async ({ team }: { team: string }) => {
      try {
        const teamId = await resolveTeam(team)
        if (!teamId) return { error: `Okänt lag: "${team}". Prova hela lagets namn.` }
        const db = getDb()

        const { data: stats } = await db
          .from('team_season_stats')
          .select('played,wins,draws,losses,points,goals_for,goals_against,xg_for,xg_against,clean_sheets,form')
          .eq('team_id', teamId)
          .eq('season_id', SEASON_ID)
          .single()
        if (!stats) return { error: `Ingen statistik för ${team} i Allsvenskan 2026.` }

        // Top scorers for this team from player_match_stats
        const { data: topPlayers } = await db
          .from('player_match_stats')
          .select('sportsmonks_player_id,goals,assists,rating,minutes_played')
          .eq('sportsmonks_team_id', teamId)
          .order('goals', { ascending: false })
          .limit(5)

        // Try to resolve player names from entities
        const playerIds = (topPlayers ?? []).map(p => p.sportsmonks_player_id).filter(Boolean)
        const { data: playerEnts } = playerIds.length
          ? await db.from('entities').select('sportmonks_id,name').in('sportmonks_id', playerIds)
          : { data: [] }
        const pnames = new Map((playerEnts ?? []).map(e => [e.sportmonks_id, e.name]))

        return {
          season: 'Allsvenskan 2026',
          team,
          ...stats,
          gd: (stats.goals_for ?? 0) - (stats.goals_against ?? 0),
          top_performers: (topPlayers ?? []).map(p => ({
            name: pnames.get(p.sportsmonks_player_id) ?? `Spelare #${p.sportsmonks_player_id}`,
            goals: p.goals,
            assists: p.assists,
            rating: p.rating,
            minutes: p.minutes_played,
          })),
        }
      } catch (e) {
        return { error: String(e) }
      }
    },
  },

  getTopScorers: {
    description: 'Hämta skytteligan och toppspelare i Allsvenskan 2026.',
    inputSchema: z.object({}),
    execute: async () => {
      try {
        const db = getDb()
        // Aggregate from player_match_stats
        const { data } = await db
          .from('player_match_stats')
          .select('sportsmonks_player_id,sportsmonks_team_id,goals,assists,rating,minutes_played')
          .gt('goals', 0)
          .order('goals', { ascending: false })
          .limit(20)

        if (!data?.length) return { error: 'Ingen skyttedata tillgänglig.' }

        // Resolve names from entities where possible
        const playerIds = data.map(p => p.sportsmonks_player_id).filter(Boolean)
        const teamIds = [...new Set(data.map(p => p.sportsmonks_team_id).filter(Boolean))]
        const [{ data: pEnts }, { data: tEnts }] = await Promise.all([
          db.from('entities').select('sportmonks_id,name').in('sportmonks_id', playerIds),
          db.from('entities').select('sportmonks_id,name').in('sportmonks_id', teamIds).eq('type', 'team'),
        ])
        const pn = new Map((pEnts ?? []).map(e => [e.sportmonks_id, e.name]))
        const tn = new Map((tEnts ?? []).map(e => [e.sportmonks_id, e.name]))

        // Aggregate per player
        const agg = new Map<number, { goals: number; assists: number; team: string; name: string }>()
        for (const r of data) {
          const id = r.sportsmonks_player_id
          if (!id) continue
          const cur = agg.get(id) ?? { goals: 0, assists: 0, team: tn.get(r.sportsmonks_team_id) ?? '?', name: pn.get(id) ?? `#${id}` }
          cur.goals += r.goals ?? 0
          cur.assists += r.assists ?? 0
          agg.set(id, cur)
        }

        return {
          season: 'Allsvenskan 2026',
          top_scorers: [...agg.values()].sort((a, b) => b.goals - a.goals).slice(0, 10),
        }
      } catch (e) {
        return { error: String(e) }
      }
    },
  },

  getMatch: {
    description: 'Hämta matchresultat eller kommande matcher i Allsvenskan 2026.',
    inputSchema: z.object({ team: z.string().optional(), date: z.string().optional() }),
    execute: async ({ team, date }: { team?: string; date?: string }) => {
      try {
        const db = getDb()
        let q = db
          .from('fixtures')
          .select('home_team,away_team,home_score,away_score,kickoff_at,status')
          .eq('sport', 'football')
          .order('kickoff_at', { ascending: false })
          .limit(10)

        if (team) {
          const id = await resolveTeam(team)
          if (id) q = q.or(`home_entity_id.eq.${id},away_entity_id.eq.${id}`)
        }
        if (date) q = q.gte('kickoff_at', date + 'T00:00:00Z').lte('kickoff_at', date + 'T23:59:59Z')

        const { data } = await q
        if (!data?.length) return { error: 'Inga matcher hittades.' }
        return { season: 'Allsvenskan 2026', matches: data }
      } catch (e) {
        return { error: String(e) }
      }
    },
  },
}
