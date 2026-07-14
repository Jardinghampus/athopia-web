import Link from "next/link";
import { ExternalLink, Brain, Trophy, Calendar } from "lucide-react";

interface NewsItem {
  title: string;
  source: string;
  timeAgo: string;
  href: string;
}

interface MatchResult {
  home: string;
  away: string;
  score: string;
  date: string;
  competition: string;
}

interface Props {
  teamName: string;
  teamSlug: string;
  news?: NewsItem[];
  aiSummary?: string | null;
  recentMatches?: MatchResult[];
  upcomingMatch?: { opponent: string; date: string; competition: string } | null;
}

export default function ForumRightSidebar({
  teamName,
  teamSlug,
  news = [],
  aiSummary = null,
  recentMatches = [],
  upcomingMatch = null,
}: Props) {
  return (
    <div className="space-y-4">
      {/* AI Summary */}
      {aiSummary && (
        <div className="rounded-xl border border-border/60 bg-card/50 p-4">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-7 h-7 rounded-full bg-blue-500/15 flex items-center justify-center">
              <Brain className="w-3.5 h-3.5 text-blue-400" />
            </div>
            <span className="text-[13px] font-semibold text-foreground">AI-sammanfattning</span>
          </div>
          <p className="text-[13px] text-muted-foreground leading-relaxed">{aiSummary}</p>
        </div>
      )}

      {/* Latest news */}
      <div className="rounded-xl border border-border/60 bg-card/50 p-4">
        <h3 className="text-[13px] font-semibold text-foreground mb-3">Senaste nytt · {teamName}</h3>
        <div className="space-y-3">
          {news.map((item, i) => (
            <a
              key={i}
              href={item.href}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-start gap-2 group"
            >
              <div className="flex-1 min-w-0">
                <p className="text-[13px] text-foreground/80 group-hover:text-foreground transition-colors leading-snug line-clamp-2">
                  {item.title}
                </p>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className="text-[12px] text-muted-foreground">{item.source}</span>
                  <span className="text-[12px] text-muted-foreground/60">·</span>
                  <span className="text-[12px] text-muted-foreground/60">{item.timeAgo}</span>
                </div>
              </div>
              <ExternalLink className="w-3 h-3 text-muted-foreground/40 group-hover:text-muted-foreground shrink-0 mt-0.5 transition-colors" />
            </a>
          ))}
        </div>
      </div>

      {/* Recent matches */}
      <div className="rounded-xl border border-border/60 bg-card/50 p-4">
        <div className="flex items-center gap-2 mb-3">
          <Trophy className="w-3.5 h-3.5 text-muted-foreground" />
          <h3 className="text-[13px] font-semibold text-foreground">Senaste matcher</h3>
        </div>
        <div className="space-y-2">
          {recentMatches.map((m, i) => (
            <div key={i} className="flex items-center justify-between py-1.5 border-b border-border/30 last:border-0">
              <div className="flex-1 min-w-0">
                <p className="text-[12px] text-foreground/80 truncate">{m.home} – {m.away}</p>
                <p className="text-[12px] text-muted-foreground">{m.competition} · {m.date}</p>
              </div>
              <span className="text-[13px] font-semibold text-foreground ml-2 tabular-nums">{m.score}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Upcoming match */}
      {upcomingMatch && (
        <div className="rounded-xl border border-border/60 bg-card/50 p-4">
          <div className="flex items-center gap-2 mb-3">
            <Calendar className="w-3.5 h-3.5 text-muted-foreground" />
            <h3 className="text-[13px] font-semibold text-foreground">Nästa match</h3>
          </div>
          <p className="text-[14px] font-semibold text-foreground">{teamName} vs {upcomingMatch.opponent}</p>
          <p className="text-[12px] text-muted-foreground mt-0.5">{upcomingMatch.date}</p>
          <p className="text-[12px] text-muted-foreground/60">{upcomingMatch.competition}</p>
        </div>
      )}

      {/* Other teams CTA */}
      <div className="rounded-xl border border-border/60 bg-card/50 p-4">
        <h3 className="text-[13px] font-semibold text-foreground mb-2">Fler communities</h3>
        <div className="flex flex-wrap gap-1.5">
          {["AIK", "Hammarby", "Malmö FF", "IFK Göteborg", "BK Häcken"].map((t) => (
            <Link
              key={t}
              href={`/forum/${t.toLowerCase().replace(/\s+/g, "-").replace(/ö/g, "o").replace(/ä/g, "a").replace(/å/g, "a")}`}
              className="text-[12px] px-2.5 py-1 rounded-full bg-zinc-800 text-muted-foreground hover:bg-zinc-700 hover:text-foreground transition-colors"
            >
              {t}
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
