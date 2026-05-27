/**
 * ScoreWidget
 * Visar live-match eller kommande match med:
 *  - hemma/borta lagnamn + logotyp
 *  - aktuellt resultat
 *  - matchminut eller starttid
 *  - live-puls-indikator
 *
 * Server Component – revalideras via ISR (60s) från parent.
 */

import Image from "next/image";
import { Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import type { SMFixture } from "@/lib/sportsmonks";
import { parseFixtureScore } from "@/lib/sportsmonks";

interface ScoreWidgetProps {
  fixture: SMFixture;
  className?: string;
}

function TeamLogo({ src, name }: { src: string; name: string }) {
  return (
    <div className="relative w-8 h-8 rounded-full overflow-hidden bg-secondary shrink-0">
      <Image src={src} alt={name} fill className="object-contain p-1" sizes="32px" />
    </div>
  );
}

export function ScoreWidget({ fixture, className }: ScoreWidgetProps) {
  const { home, away, homeGoals, awayGoals, liveMinute, isLive } =
    parseFixtureScore(fixture);

  const startTime = new Date(fixture.starting_at).toLocaleTimeString("sv-SE", {
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <div
      className={cn(
        "flex flex-col gap-2 p-3 rounded-xl border border-border bg-card",
        isLive && "border-pitch/30 bg-pitch/5",
        className
      )}
    >
      {/* Liga + live-badge */}
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span className="truncate">{fixture.league?.name}</span>
        {isLive ? (
          <span className="flex items-center gap-1 text-pitch-light font-medium">
            <span className="live-dot" />
            LIVE
          </span>
        ) : (
          <span className="flex items-center gap-1">
            <Clock className="w-3 h-3" />
            {startTime}
          </span>
        )}
      </div>

      {/* Matchrad */}
      <div className="flex items-center gap-2">
        {/* Hemmalag */}
        <div className="flex items-center gap-2 flex-1 min-w-0">
          {home?.image_path && <TeamLogo src={home.image_path} name={home.name} />}
          <span
            className={cn(
              "text-sm font-medium truncate",
              home?.meta.winner === true && "text-pitch-light"
            )}
          >
            {home?.name ?? "?"}
          </span>
        </div>

        {/* Resultat */}
        <div className="flex items-center gap-1.5 shrink-0">
          {homeGoals !== null && awayGoals !== null ? (
            <>
              <span
                className={cn(
                  "text-xl font-heading tabular-nums",
                  home?.meta.winner === true ? "text-pitch-light" : "text-foreground"
                )}
              >
                {homeGoals}
              </span>
              <span className="text-muted-foreground text-sm">–</span>
              <span
                className={cn(
                  "text-xl font-heading tabular-nums",
                  away?.meta.winner === true ? "text-pitch-light" : "text-foreground"
                )}
              >
                {awayGoals}
              </span>
            </>
          ) : (
            <span className="text-sm text-muted-foreground">vs</span>
          )}
        </div>

        {/* Bortalag */}
        <div className="flex items-center gap-2 flex-1 min-w-0 justify-end">
          <span
            className={cn(
              "text-sm font-medium truncate",
              away?.meta.winner === true && "text-pitch-light"
            )}
          >
            {away?.name ?? "?"}
          </span>
          {away?.image_path && <TeamLogo src={away.image_path} name={away.name} />}
        </div>
      </div>

      {/* Minut */}
      {isLive && liveMinute !== null && (
        <p className="text-center text-xs text-pitch font-medium">
          {liveMinute}&apos;
        </p>
      )}
    </div>
  );
}
