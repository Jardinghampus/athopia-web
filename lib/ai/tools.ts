import type { Tool } from 'ai'
import { z } from 'zod'
import { createClient } from '@supabase/supabase-js'
import { searchArticles } from './embedding'
import { resolveTeam, resolvePlayer } from './resolve'

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
  searchNews: {
    description: 'Sök senaste nyheter och artiklar om Allsvenskan, lag eller spelare.',
    inputSchema: z.object({ query: z.string() }),
    execute: async ({ query }: { query: string }) => {
      try {
        const results = await searchArticles(query, 5)
        if (!results.length) return { results: [], message: 'Inga nyheter hittades.' }
        return { results: results.map((r) => ({ title: r.title, url: r.url, excerpt: r.chunk.slice(0, 300) })) }
      } catch {
        return { results: [], message: 'Nyhetssökning tillfälligt otillgänglig.' }
      }
    },
  },

  getStandings: {
    description: 'Hämta aktuell tabellställning i Allsvenskan.',
    inputSchema: z.object({ league: z.string().optional() }),
    execute: async (_args: { league?: string }) => {
      const db = getDb()
      const { data } = await db
        .from('team_season_stats')
        .select('team_id,played,wins,draws,losses,points,goals_for,goals_against,form')
        .eq('season_id', SEASON_ID)
        .order('points', { ascending: false })
        .order('goals_for', { ascending: false })
      if (!data?.length) return { error: 'Tabelldata saknas.' }
      const { data: ents } = await db.from('entities').select('sportmonks_id,name').in('sportmonks_id', data.map(r => r.team_id)).eq('type', 'team')
      const nm = new Map((ents ?? []).map(e => [e.sportmonks_id, e.name]))
      return { standings: data.map((r, i) => ({ pos: i + 1, team: nm.get(r.team_id) ?? String(r.team_id), played: r.played, points: r.points, wins: r.wins, draws: r.draws, losses: r.losses, gd: (r.goals_for ?? 0) - (r.goals_against ?? 0), form: r.form })) }
    },
  },

  getTeamStats: {
    description: 'Hämta detaljerad statistik för ett specifikt lag.',
    inputSchema: z.object({ team: z.string() }),
    execute: async ({ team }: { team: string }) => {
      const teamId = await resolveTeam(team)
      if (!teamId) return { error: `Okänt lag: "${team}".` }
      const db = getDb()
      const { data } = await db.from('team_season_stats').select('*').eq('team_id', teamId).eq('season_id', SEASON_ID).single()
      if (!data) return { error: `Ingen statistik för ${team}.` }
      return { ...data }
    },
  },

  getPlayerStats: {
    description: 'Hämta statistik för en specifik spelare.',
    inputSchema: z.object({ player: z.string() }),
    execute: async ({ player }: { player: string }) => {
      const playerId = await resolvePlayer(player)
      if (!playerId) return { error: `Okänd spelare: "${player}".` }
      const db = getDb()
      const { data } = await db.from('player_season_stats').select('player_name,team_name,minutes,goals,assists,shots,rating,xg').eq('sportsmonks_player_id', playerId).eq('season_id', SEASON_ID).single()
      if (!data) return { error: `Ingen statistik för ${player}.` }
      return data
    },
  },

  getMatch: {
    description: 'Hämta info om en match — resultat eller kommande möte.',
    inputSchema: z.object({ teamA: z.string().optional(), teamB: z.string().optional(), date: z.string().optional() }),
    execute: async ({ teamA, date }: { teamA?: string; teamB?: string; date?: string }) => {
      const db = getDb()
      let q = db.from('fixtures').select('home_team,away_team,home_score,away_score,kickoff_at,status').eq('sport', 'football').order('kickoff_at', { ascending: false }).limit(5)
      if (teamA) { const id = await resolveTeam(teamA); if (id) q = q.or(`home_entity_id.eq.${id},away_entity_id.eq.${id}`) }
      if (date) q = q.gte('kickoff_at', date + 'T00:00:00Z').lte('kickoff_at', date + 'T23:59:59Z')
      const { data } = await q
      if (!data?.length) return { error: 'Inga matcher hittades.' }
      return { matches: data }
    },
  },
}
