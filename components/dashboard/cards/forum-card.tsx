import Link from 'next/link'
import { MessageSquare, Eye, ArrowRight } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import type { DashThread } from '@/lib/dashboard/types'

export function ForumCard({ threads, teamSlug }: { threads: DashThread[]; teamSlug: string }) {
  return (
    <Card className="flex flex-col">
      <CardHeader className="flex-row items-center gap-2 space-y-0 pb-3">
        <MessageSquare className="h-4 w-4 text-muted-foreground" />
        <CardTitle className="text-base">Forum</CardTitle>
      </CardHeader>
      <CardContent className="flex-1 space-y-3">
        {threads.length === 0 ? (
          <p className="py-4 text-sm text-muted-foreground">Inga trådar än.</p>
        ) : (
          threads.map((t) => (
            <Link key={t.id} href={`/lag/${teamSlug}/forum/${t.id}`} className="block hover:opacity-80 transition-opacity">
              <p className="line-clamp-1 text-sm font-medium">{t.title}</p>
              <div className="mt-1 flex items-center gap-3 text-xs text-muted-foreground">
                <Badge variant="secondary" className="gap-1 px-1.5 py-0">
                  <MessageSquare className="h-3 w-3" /> {t.reply_count}
                </Badge>
                <Badge variant="secondary" className="gap-1 px-1.5 py-0">
                  <Eye className="h-3 w-3" /> {t.view_count}
                </Badge>
              </div>
            </Link>
          ))
        )}
      </CardContent>
      <CardFooter className="pt-2">
        <Link href={`/lag/${teamSlug}/forum`} className="ml-auto flex items-center text-sm text-muted-foreground hover:text-foreground transition-colors">
          Till forum <ArrowRight className="ml-1 h-3 w-3" />
        </Link>
      </CardFooter>
    </Card>
  )
}
