import { ListOrdered } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { DashStanding } from '@/lib/dashboard/types'

// 3-letter abbreviations for Allsvenskan clubs
const ABBR: Record<string, string> = {
  'aik':              'AIK',
  'bk-hacken':        'HCK',
  'djurgardens-if':   'DIF',
  'gais':             'GAIS',
  'hammarby-if':      'HBK',
  'helsingborgs-if':  'HIF',
  'ifk-goteborg':     'IFK',
  'ifk-norrkoping':   'IFK N',
  'ifk-varnamo':      'VRN',
  'if-elfsborg':      'ELF',
  'kalmar-ff':        'KFF',
  'malmo-ff':         'MFF',
  'mjallby-aif':      'MJÄ',
  'degerfors-if':     'DEG',
  'halmstads-bk':     'HBK',
  'vasteras-sk':      'VSK',
}

function abbr(name: string, slug: string): string {
  return ABBR[slug] ?? name.slice(0, 3).toUpperCase()
}

export function StandingsCard({
  rows,
  activeTeamSlug,
  className,
}: {
  rows: DashStanding[]
  activeTeamSlug?: string
  className?: string
}) {
  return (
    <Card className={cn('flex flex-col', className)}>
      <CardHeader className="flex-row items-center gap-2 space-y-0 pb-3">
        <ListOrdered className="h-4 w-4 text-muted-foreground shrink-0" />
        <CardTitle className="text-base">Allsvenskan</CardTitle>
      </CardHeader>
      <CardContent className="flex-1 p-0">
        {rows.length === 0 ? (
          <p className="py-4 px-4 text-sm text-muted-foreground">
            Tabell laddas när Sportsmonks API-nyckel är konfigurerad.
          </p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border/40 text-muted-foreground text-xs">
                <th className="w-6 pl-4 py-1.5 text-left font-medium">#</th>
                <th className="pl-2 py-1.5 text-left font-medium">Lag</th>
                <th className="pr-3 py-1.5 text-right font-medium w-8">S</th>
                <th className="pr-3 py-1.5 text-right font-medium w-10">+/–</th>
                <th className="pr-4 py-1.5 text-right font-semibold w-8">P</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => {
                const isActive = r.team_slug === activeTeamSlug
                return (
                  <tr
                    key={r.team_slug}
                    className={cn(
                      'border-b border-border/20 last:border-0',
                      isActive
                        ? 'bg-pitch/8 font-medium text-foreground'
                        : 'text-foreground/80'
                    )}
                  >
                    <td className="pl-4 py-2 text-muted-foreground text-xs tabular-nums w-6">{r.position}</td>
                    <td className="pl-2 py-2 max-w-0">
                      {/* Full name on ≥sm, abbreviated on mobile */}
                      <span className="hidden sm:inline truncate">{r.team_name}</span>
                      <span className="sm:hidden font-medium">{abbr(r.team_name, r.team_slug)}</span>
                    </td>
                    <td className="pr-3 py-2 text-right tabular-nums text-muted-foreground text-xs">{r.played}</td>
                    <td className="pr-3 py-2 text-right tabular-nums text-muted-foreground text-xs">
                      {r.goal_diff > 0 ? `+${r.goal_diff}` : r.goal_diff}
                    </td>
                    <td className="pr-4 py-2 text-right tabular-nums font-semibold">{r.points}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </CardContent>
    </Card>
  )
}
