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
import type { SMFixture } from "@/lib/db/fixtures";
import { parseFixtureScore } from "@/lib/db/fixtures";

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

/** "Idag 17:00" / "Imorgon 19:30" / "lör 12 jul 16:00" */
function kickoffLabel(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";

  const time = d.toLocaleTimeString("sv-SE", { hour: "2-digit", minute: "2-digit" });
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);
  const startOfKickoff = new Date(d);
  startOfKickoff.setHours(0, 0, 0, 0);
  const dayDiff = Math.round(
    (startOfKickoff.getTime() - startOfToday.getTime()) / 86_400_000,
  );

  if (dayDiff === 0) return `Idag ${time}`;
  if (dayDiff === 1) return `Imorgon ${time}`;
  if (dayDiff === -1) return `Igår ${time}`;

  const date = d.toLocaleDateString("sv-SE", {
    weekday: "short",
    day: "numeric",
    month: "short",
  });
  return `${date} ${time}`;
}

export function ScoreWidget({ fixture, className }: ScoreWidgetProps) {
  const { home, away, homeGoals, awayGoals, liveMinute, isLive } =
    parseFixtureScore(fixture);

  const when = kickoffLabel(fixture.starting_at);

  return (
    <div
      className={cn(
        "flex flex-col gap-2 p-3 rounded-xl border border-border bg-card",
        isLive && "border-pitch/30 bg-pitch/5",
        className
      )}
    >
      {/* Liga + live-badge / datum+tid */}
      <div className="flex items-center justify-between text-xs text-muted-foreground gap-2">
        <span className="truncate">{fixture.league?.name}</span>
        {isLive ? (
          <span className="flex items-center gap-1 text-pitch-light font-medium shrink-0">
            <span className="live-dot" />
            LIVE
          </span>
        ) : (
          <span className="flex items-center gap-1 shrink-0 tabular-nums">
            <Clock className="w-3 h-3" />
            {when}
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
