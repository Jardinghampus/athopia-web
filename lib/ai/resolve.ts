import { createClient } from '@supabase/supabase-js'

function getDb() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY!
  return createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } })
}

// Common Swedish club aliases → canonical name fragment
const TEAM_ALIASES: Record<string, string> = {
  bajen: 'Hammarby',
  djurgårn: 'Djurgårdens',
  djurgarn: 'Djurgårdens',
  gnaget: 'AIK',
  blåvitt: 'IFK Göteborg',
  blavitt: 'IFK Göteborg',
  efk: 'IFK Göteborg',
  ifk: 'IFK',
  mff: 'Malmö FF',
  malmö: 'Malmö FF',
  malmo: 'Malmö FF',
  hbk: 'Halmstads BK',
  häcken: 'BK Häcken',
  hacken: 'BK Häcken',
  sirius: 'IK Sirius',
  kalmar: 'Kalmar FF',
  elfsborg: 'IF Elfsborg',
  norrköping: 'IFK Norrköping',
  örebro: 'Örebro SK',
  orebro: 'Örebro SK',
  varberg: 'Varbergs BoIS',
  mjällby: 'Mjällby AIF',
  mjallby: 'Mjällby AIF',
  degerfors: 'Degerfors IF',
  brommapojkarna: 'Brommapojkarna',
  bp: 'Brommapojkarna',
}

function normalize(s: string) {
  return s.toLowerCase().trim().replace(/å/g, 'a').replace(/ä/g, 'a').replace(/ö/g, 'o')
}

export async function resolveTeam(name: string): Promise<number | null> {
  const db = getDb()
  const normalized = normalize(name)

  // Check alias map first
  const aliasMatch = TEAM_ALIASES[normalized]
  const searchTerm = aliasMatch ?? name

  const { data } = await db
    .from('entities')
    .select('sportmonks_id, name')
    .eq('type', 'team')
    .ilike('name', `%${searchTerm}%`)
    .limit(1)

  return data?.[0]?.sportmonks_id ?? null
}

export async function resolvePlayer(name: string): Promise<number | null> {
  const db = getDb()

  const { data } = await db
    .from('players')
    .select('sportmonks_id, name')
    .ilike('name', `%${name}%`)
    .limit(1)

  return data?.[0]?.sportmonks_id ?? null
}
