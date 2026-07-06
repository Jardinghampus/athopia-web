import Link from "next/link";
import { Clock, Radio } from "lucide-react";

function formatPlayerStat(goals: number | null, xg: number | null): string | null {
  const g = goals != null && goals > 0 ? goals : null;
  const x = xg != null && xg > 0 ? xg : null;
  if (g != null && x != null) return `${g} mål · ${x.toFixed(2)} xG`;
  if (x != null) return `${x.toFixed(2)} xG`;
  if (g != null) return `${g} mål`;
  return null;
}

export function MatchLineups({
  homeName,
  awayName,
  homeLup,
  awayLup,
  playerStats,
}: {
  homeName: string;
  awayName: string;
  homeLup: Record<string, unknown>[];
  awayLup: Record<string, unknown>[];
  playerStats: Record<number, { goals: number | null; xg: number | null }>;
}) {
  if (homeLup.length === 0 && awayLup.length === 0) return null;

  return (
    <div className="bg-card border border-border rounded-xl p-4">
      <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">
        Startelvor
      </h3>
      <div className="grid grid-cols-2 gap-3">
        {[
          { name: homeName, players: homeLup },
          { name: awayName, players: awayLup },
        ].map(({ name, players }) => (
          <div key={name}>
            <p className="text-xs font-semibold text-foreground mb-2 truncate">{name}</p>
            {players.map((p, i) => {
              const pl = p.players as Record<string, unknown> | null;
              const pid = p.player_id as number;
              const stats = playerStats[pid];
              const statLabel = stats
                ? formatPlayerStat(stats.goals, stats.xg)
                : null;
              const href = `/spelare/${(pl?.slug as string | null) ?? String(pid ?? "")}`;
              return (
                <div
                  key={i}
                  className="text-xs text-muted-foreground py-0.5 flex items-center gap-1 min-w-0"
                >
                  <span className="text-foreground/50 w-4 shrink-0">
                    {(p.jersey as number | null) ?? "—"}
                  </span>
                  {pl ? (
                    <Link href={href} className="truncate hover:text-pitch min-w-0 flex-1">
                      {pl.fullname as string}
                    </Link>
                  ) : (
                    <span className="truncate flex-1">–</span>
                  )}
                  {statLabel ? (
                    <span className="text-[10px] tabular-nums text-muted-foreground shrink-0 ml-auto">
                      {statLabel}
                    </span>
                  ) : null}
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}

/** Kompakt rad för spelare med mål/xG — återanvändbar i matchvyer. */
export function PlayerMatchStatBadge({
  goals,
  xg,
}: {
  goals: number | null;
  xg: number | null;
}) {
  const label = formatPlayerStat(goals, xg);
  if (!label) return null;
  return (
    <span className="text-[10px] tabular-nums text-muted-foreground">{label}</span>
  );
}
