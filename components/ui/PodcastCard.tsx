/**
 * PodcastCard
 * Visar en podcast-episod med:
 *  - show-namn + episodtitel
 *  - duration (mm:ss)
 *  - badge om transkript finns (PRO)
 *  - klickbar till /podcast/[id]
 */

import Link from "next/link";
import { Mic, FileText, Clock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { EntityChip } from "./EntityChip";
import type { PodcastEpisode } from "@/lib/supabase";

interface PodcastCardProps {
  episode: PodcastEpisode;
}

function formatDuration(seconds: number) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export function PodcastCard({ episode }: PodcastCardProps) {
  return (
    <Link
      href={`/podcast/${episode.id}`}
      className="group flex gap-4 p-4 rounded-xl border border-border bg-card hover:border-pitch/40 transition-all duration-200 hover:shadow-[0_0_16px_rgba(29,158,117,0.08)]"
    >
      {/* Ikon-thumbnail */}
      <div className="w-12 h-12 rounded-xl pitch-gradient flex items-center justify-center shrink-0">
        <Mic className="w-5 h-5 text-white" />
      </div>

      {/* Innehåll */}
      <div className="flex flex-col gap-2 min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="text-xs text-pitch font-medium mb-0.5 truncate">
              {episode.show_name}
            </p>
            <h3 className="font-medium text-sm text-foreground line-clamp-2 group-hover:text-pitch-light transition-colors">
              {episode.title}
            </h3>
          </div>

          {/* Transkript-badge */}
          {episode.transcript_html && (
            <Badge
              variant="outline"
              className="text-xs border-pitch/40 text-pitch-light shrink-0 gap-1"
            >
              <FileText className="w-3 h-3" />
              PRO
            </Badge>
          )}
        </div>

        <div className="flex items-center justify-between">
          {/* Entiteter */}
          <div className="flex flex-wrap gap-1">
            {episode.entities?.slice(0, 2).map((e) => (
              <EntityChip key={e.id} entity={e} static />
            ))}
          </div>

          {/* Duration */}
          <span className="flex items-center gap-1 text-xs text-muted-foreground shrink-0">
            <Clock className="w-3 h-3" />
            {formatDuration(episode.duration_seconds)}
          </span>
        </div>
      </div>
    </Link>
  );
}
