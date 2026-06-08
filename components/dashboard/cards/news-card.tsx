import Link from 'next/link'
import { Newspaper, ArrowRight } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { sv } from 'date-fns/locale'
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import type { DashArticle } from '@/lib/dashboard/types'

export function NewsCard({ items, teamSlug }: { items: DashArticle[]; teamSlug: string }) {
  return (
    <Card className="flex flex-col">
      <CardHeader className="flex-row items-center gap-2 space-y-0 pb-3">
        <Newspaper className="h-4 w-4 text-muted-foreground" />
        <CardTitle className="text-base">Senaste nytt</CardTitle>
      </CardHeader>
      <CardContent className="flex-1 space-y-1">
        {items.length === 0 ? (
          <p className="py-4 text-sm text-muted-foreground">Inga artiklar än.</p>
        ) : (
          items.map((a, i) => (
            <div key={a.id}>
              {i > 0 && <Separator className="my-2" />}
              <Link href={`/artikel/${a.slug}`} className="block hover:opacity-80 transition-opacity">
                <p className="line-clamp-2 text-sm font-medium leading-snug">{a.title}</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {formatDistanceToNow(new Date(a.published_at), { locale: sv, addSuffix: true })}
                </p>
              </Link>
            </div>
          ))
        )}
      </CardContent>
      <CardFooter className="pt-2">
        <Link href={`/lag/${teamSlug}/nyheter`} className="ml-auto flex items-center text-sm text-muted-foreground hover:text-foreground transition-colors">
          Alla nyheter <ArrowRight className="ml-1 h-3 w-3" />
        </Link>
      </CardFooter>
    </Card>
  )
}
