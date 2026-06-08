import { ListOrdered } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import type { DashStanding } from '@/lib/dashboard/types'

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
        <ListOrdered className="h-4 w-4 text-muted-foreground" />
        <CardTitle className="text-base">Allsvenskan-tabell</CardTitle>
      </CardHeader>
      <CardContent className="flex-1">
        {rows.length === 0 ? (
          <p className="py-4 text-sm text-muted-foreground">
            Tabell laddas när Sportsmonks API-nyckel är konfigurerad.
          </p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-8">#</TableHead>
                <TableHead>Lag</TableHead>
                <TableHead className="text-right">S</TableHead>
                <TableHead className="text-right">+/–</TableHead>
                <TableHead className="text-right font-semibold">P</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((r) => (
                <TableRow
                  key={r.team_slug}
                  className={cn(r.team_slug === activeTeamSlug && 'bg-muted/60 font-medium')}
                >
                  <TableCell>{r.position}</TableCell>
                  <TableCell>{r.team_name}</TableCell>
                  <TableCell className="text-right">{r.played}</TableCell>
                  <TableCell className="text-right">{r.goal_diff > 0 ? `+${r.goal_diff}` : r.goal_diff}</TableCell>
                  <TableCell className="text-right font-semibold">{r.points}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  )
}
