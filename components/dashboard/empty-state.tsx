import Link from 'next/link'
import { Star } from 'lucide-react'

export function EmptyState() {
  return (
    <div className="mx-auto flex max-w-md flex-col items-center gap-4 py-24 text-center">
      <Star className="h-10 w-10 text-muted-foreground" />
      <h2 className="text-xl font-semibold">Följ ett lag för att komma igång</h2>
      <p className="text-sm text-muted-foreground">
        Din dashboard fylls med nyheter, matcher, statistik och forum för lagen du följer.
      </p>
      <Link href="/lag" className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors">
        Hitta lag att följa
      </Link>
    </div>
  )
}
