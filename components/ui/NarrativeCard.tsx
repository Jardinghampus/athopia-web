/**
 * NarrativeCard
 * Visar ett narrativ (trendande berättelse) med:
 *  - ämnesrubrik
 *  - score-bar (0–100)
 *  - antal källor
 *  - trend-pil (up/down/stable)
 */

import Link from "next/link";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import type { Narrative } from "@/lib/supabase";
import { EntityChip } from "./EntityChip";
import { cn } from "@/lib/utils";

interface NarrativeCardProps {
  narrative: Narrative;
  rank?: number;
}

function TrendIcon({ trend }: { trend: Narrative["trend"] }) {
  if (trend === "up")
    return <TrendingUp className="w-4 h-4 text-pitch-light" aria-label="Stigande trend" />;
  if (trend === "down")
    return <TrendingDown className="w-4 h-4 text-red-400" aria-label="Sjunkande trend" />;
  return <Minus className="w-4 h-4 text-muted-foreground" aria-label="Stabil trend" />;
}

export function NarrativeCard({ narrative, rank }: NarrativeCardProps) {
  const scoreBarWidth = `${Math.min(narrative.score, 100)}%`;

  return (
    <div className="flex gap-4 p-4 rounded-xl border border-border bg-card hover:border-pitch/30 transition-colors">
      {/* Ranknummer */}
      {rank !== undefined && (
        <span className="font-heading text-3xl text-pitch/40 tabular-nums shrink-0 w-8 mt-1">
          {rank}
        </span>
      )}

      <div className="flex flex-col gap-3 flex-1 min-w-0">
        {/* Rubrik + trend */}
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-heading text-lg text-foreground leading-tight line-clamp-2">
            {narrative.topic}
          </h3>
          <TrendIcon trend={narrative.trend} />
        </div>

        {/* Score-bar */}
        <div className="space-y-1">
          <div
            className="h-1.5 rounded-full bg-secondary overflow-hidden"
            role="progressbar"
            aria-valuenow={narrative.score}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label={`Narrativ styrka: ${narrative.score}/100`}
          >
            <div
              className={cn(
                "h-full rounded-full transition-all duration-700",
                narrative.score >= 70
                  ? "bg-pitch"
                  : narrative.score >= 40
                  ? "bg-pitch/60"
                  : "bg-pitch/30"
              )}
              style={{ width: scoreBarWidth }}
            />
          </div>
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>{narrative.source_count} källor</span>
            <span>{narrative.score}/100</span>
          </div>
        </div>

        {/* Entiteter */}
        {narrative.entities?.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {narrative.entities.slice(0, 4).map((e) => (
              <EntityChip key={e.id} entity={e} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
