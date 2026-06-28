import Link from "next/link";
import { Users, TrendingUp, Hash } from "lucide-react";

interface Team {
  slug: string;
  name: string;
}

interface Props {
  teams: Team[];
  currentSlug: string;
}

const TOP_TAGS = [
  { label: "transfer", emoji: "✍️", count: 124 },
  { label: "match", emoji: "⚽", count: 98 },
  { label: "taktik", emoji: "🧠", count: 67 },
  { label: "rykte", emoji: "🔥", count: 45 },
];

export default function ForumLeftSidebar({ teams, currentSlug }: Props) {
  const featured = teams.slice(0, 8);

  return (
    <div className="space-y-4">
      {/* Navigation */}
      <div className="rounded-xl border border-border/60 bg-card/50 p-4">
        <div className="flex items-center gap-2 mb-3">
          <Users className="w-3.5 h-3.5 text-muted-foreground" />
          <h3 className="text-[13px] font-semibold text-foreground">Allsvenskan</h3>
        </div>
        <nav className="space-y-0.5">
          {featured.map((t) => (
            <Link
              key={t.slug}
              href={`/forum/${t.slug}`}
              className={`flex items-center gap-2.5 px-2.5 min-h-[44px] rounded-xl text-[13px] transition-colors ${
                t.slug === currentSlug
                  ? "bg-zinc-800 text-foreground font-medium"
                  : "text-muted-foreground hover:bg-card hover:text-foreground"
              }`}
            >
              <div className="w-6 h-6 rounded-full bg-zinc-700 flex items-center justify-center text-[10px] font-bold text-zinc-300 shrink-0">
                {t.name.slice(0, 2).toUpperCase()}
              </div>
              <span className="truncate">{t.name}</span>
            </Link>
          ))}
        </nav>
        {teams.length > 8 && (
          <Link href="/forum" className="block mt-2 text-[12px] text-muted-foreground hover:text-foreground transition-colors px-2.5">
            Visa alla →
          </Link>
        )}
      </div>

      {/* Trending tags */}
      <div className="rounded-xl border border-border/60 bg-card/50 p-4">
        <div className="flex items-center gap-2 mb-3">
          <TrendingUp className="w-3.5 h-3.5 text-muted-foreground" />
          <h3 className="text-[13px] font-semibold text-foreground">Trending</h3>
        </div>
        <div className="space-y-2">
          {TOP_TAGS.map((t) => (
            <div key={t.label} className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <span className="text-base">{t.emoji}</span>
                <span className="text-[13px] text-foreground capitalize">{t.label}</span>
              </div>
              <span className="text-[12px] text-muted-foreground tabular-nums">{t.count}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Quick links */}
      <div className="rounded-xl border border-border/60 bg-card/50 p-4">
        <div className="flex items-center gap-2 mb-3">
          <Hash className="w-3.5 h-3.5 text-muted-foreground" />
          <h3 className="text-[13px] font-semibold text-foreground">Utforska</h3>
        </div>
        <div className="space-y-1">
          {[
            { label: "Transfernyheter", href: "/forum?tag=transfer" },
            { label: "Matchanalyser", href: "/forum?tag=match" },
            { label: "Taktikdiskussioner", href: "/forum?tag=taktik" },
          ].map((l) => (
            <Link key={l.label} href={l.href} className="block text-[13px] text-muted-foreground hover:text-foreground transition-colors min-h-[44px] flex items-center">
              {l.label}
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
