'use client'

import { useState } from 'react'
import { useUser } from '@clerk/nextjs'
import { createClient } from '@/lib/supabase-browser'
import { getTeamAccent } from '@/lib/team-colors'

const ALLSVENSKAN_TEAMS = [
  { slug: 'aik', name: 'AIK' },
  { slug: 'malmo-ff', name: 'Malmö FF' },
  { slug: 'ifk-goteborg', name: 'IFK Göteborg' },
  { slug: 'djurgarden', name: 'Djurgårdens IF' },
  { slug: 'hammarby', name: 'Hammarby IF' },
  { slug: 'ifk-norrkoping', name: 'IFK Norrköping' },
  { slug: 'bk-hacken', name: 'BK Häcken' },
  { slug: 'kalmar-ff', name: 'Kalmar FF' },
  { slug: 'if-elfsborg', name: 'IF Elfsborg' },
  { slug: 'vasteras-sk', name: 'Västerås SK' },
  { slug: 'sirius', name: 'IK Sirius' },
  { slug: 'brommapojkarna', name: 'IF Brommapojkarna' },
  { slug: 'hif', name: 'Helsingborgs IF' },
  { slug: 'orebro-sk', name: 'Örebro SK' },
  { slug: 'gif-sundsvall', name: 'GIF Sundsvall' },
  { slug: 'halmstad-bk', name: 'Halmstads BK' },
]

export function OnboardingLeaguePicker({ onComplete }: { onComplete: () => void }) {
  const { user } = useUser()
  const [selected, setSelected] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  async function joinLeague() {
    if (!selected || !user) return
    setSaving(true)

    const supabase = createClient()

    const { data: league } = await (supabase as any)
      .from('fan_leagues')
      .select('id')
      .eq('team_slug', selected)
      .single()

    if (league) {
      await (supabase as any).from('user_league_memberships').upsert({
        clerk_user_id: user.id,
        league_id: league.id,
      }, { onConflict: 'clerk_user_id' })
    }

    setSaving(false)
    onComplete()
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-6">
      <div className="max-w-md w-full space-y-6">
        <div>
          <h2 className="text-2xl font-black text-white">Välj ditt lag</h2>
          <p className="text-white/50 text-sm mt-1">
            Du tävlar mot andra fans av samma lag. Välj klokt.
          </p>
        </div>

        <div className="grid grid-cols-3 gap-2 max-h-72 overflow-y-auto">
          {ALLSVENSKAN_TEAMS.map(team => (
            <button
              key={team.slug}
              onClick={() => setSelected(team.slug)}
              className={`rounded-lg border p-3 text-center transition-all ${
                selected === team.slug
                  ? 'border-pitch bg-pitch/10 text-white'
                  : 'border-white/10 text-white/50 hover:border-white/30 hover:text-white'
              }`}
            >
              <div
                className="w-2 h-2 rounded-full mx-auto mb-1"
                style={{ backgroundColor: getTeamAccent(team.slug) }}
              />
              <span className="text-xs font-semibold">{team.name}</span>
            </button>
          ))}
        </div>

        <button
          onClick={joinLeague}
          disabled={!selected || saving}
          className="w-full py-3 rounded-lg bg-pitch text-white font-bold disabled:opacity-40 transition-opacity"
        >
          {saving ? 'Sparar...' : 'Gå med i ligan →'}
        </button>
      </div>
    </div>
  )
}
