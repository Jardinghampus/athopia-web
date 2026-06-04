/**
 * NarrativeCard
 * Props:
 * - narrative: Narrative
 * - compact?: boolean
 *
 * Klickbar → /narrativ/[id]
 */

import Link from "next/link";
import { TrendingUp, TrendingDown, Minus, Newspaper } from "lucide-react";
import type { Narrative } from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface NarrativeCardProps {
  narrative: Narrative;
  compact?: boolean;
}

function TrendIcon({ trend }: { trend: Narrative["trend"] }) {
  if (trend === "rising")
    return <TrendingUp className="w-4 h-4 text-pitch-light animate-slide-up" aria-label="Stigande trend" />;
  if (trend === "falling")
    return <TrendingDown className="w-4 h-4 text-red-400 animate-slide-up" aria-label="Sjunkande trend" />;
  return <Minus className="w-4 h-4 text-muted-foreground" aria-label="Stabil trend" />;
}

function scoreToPercent(score: number) {
  const s = Number.isFinite(score) ? score : 0;
  return Math.max(0, Math.min(100, Math.round(s * 100)));
}

function scoreColor(score: number) {
  // 0..1 → röd→gul→grön
  if (score >= 0.67) return "bg-pitch";
  if (score >= 0.34) return "bg-amber-500";
  return "bg-red-500";
}

export function NarrativeCard({ narrative, compact = false }: NarrativeCardProps) {
  const percent = scoreToPercent(narrative.score);

  return (
    <Link
      href={`/narrativ/${narrative.id}`}
      className="group block rounded-2xl border border-border bg-card p-4 hover:border-pitch/30 transition-colors"
    >
      <div className="flex items-start justify-between gap-3">
        <h3 className="font-heading text-xl text-foreground leading-tight line-clamp-2">
          {narrative.topic}
        </h3>
        <TrendIcon trend={narrative.trend} />
      </div>

      {!compact && (
        <div className="mt-4 space-y-2">
          <div className="relative">
            <div className="h-2 rounded-full bg-secondary overflow-hidden" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={percent}>
              <div className={cn("h-full rounded-full transition-all duration-700", scoreColor(narrative.score))} style={{ width: `${percent}%` }} />
            </div>
          </div>
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <Newspaper className="w-3 h-3" />
              {narrative.sourceCount} källor
            </span>
            <Badge variant="outline" className="border-white/10 text-foreground/80">
              {percent}%
            </Badge>
          </div>
        </div>
      )}

      {compact && (
        <div className="mt-2 text-xs text-muted-foreground flex items-center gap-2">
          <span>{narrative.sourceCount} källor</span>
          <span>•</span>
          <span>{percent}%</span>
        </div>
      )}
    </Link>
  );
}
