'use client'

import Link from 'next/link'
import { BarChart3, ArrowRight } from 'lucide-react'
import { Bar, BarChart, CartesianGrid, XAxis } from 'recharts'
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card'
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from '@/components/ui/chart'
import type { DashStatPoint } from '@/lib/dashboard/types'

const config = {
  goals_for: { label: 'Gjorda', color: 'hsl(var(--chart-1))' },
  goals_against: { label: 'Insläppta', color: 'hsl(var(--chart-2))' },
} satisfies ChartConfig

export function StatsCard({ data, teamSlug }: { data: DashStatPoint[]; teamSlug: string }) {
  return (
    <Card className="flex flex-col">
      <CardHeader className="flex-row items-center gap-2 space-y-0 pb-3">
        <BarChart3 className="h-4 w-4 text-muted-foreground" />
        <CardTitle className="text-base">Form — senaste 5</CardTitle>
      </CardHeader>
      <CardContent className="flex-1">
        {data.length === 0 ? (
          <p className="py-4 text-sm text-muted-foreground">Ingen statistik än.</p>
        ) : (
          <ChartContainer config={config} className="h-[160px] w-full">
            <BarChart data={data}>
              <CartesianGrid vertical={false} />
              <XAxis dataKey="label" tickLine={false} axisLine={false} tickMargin={8} />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Bar dataKey="goals_for" fill="var(--color-goals_for)" radius={4} />
              <Bar dataKey="goals_against" fill="var(--color-goals_against)" radius={4} />
            </BarChart>
          </ChartContainer>
        )}
      </CardContent>
      <CardFooter className="pt-2">
        <Link href={`/lag/${teamSlug}/statistik`} className="ml-auto flex items-center text-sm text-muted-foreground hover:text-foreground transition-colors">
          Full statistik <ArrowRight className="ml-1 h-3 w-3" />
        </Link>
      </CardFooter>
    </Card>
  )
}
