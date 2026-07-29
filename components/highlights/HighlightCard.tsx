import { PlayCircle, ExternalLink } from "lucide-react";
import type { Highlight } from "@/lib/highlights/queries";

/**
 * Höjdpunkts-kort — länkar UT till SVT. Ingen re-hostad video, ingen kopierad text
 * (upphovsrätt): bara rubrik + thumbnail + länk. Öppnas i ny flik.
 */
export function HighlightCard({ highlight }: { highlight: Highlight }) {
  const href = highlight.source_url;

  const inner = (
    <>
      <div className="relative aspect-video w-full overflow-hidden rounded-xl bg-muted">
        {highlight.thumbnail_url ? (
          // ponytail: <img>, inte next/image — SVT:s CDN-hostar varierar och ligger
          // inte i next.config remotePatterns; next/image skulle krascha på okänd host.
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={highlight.thumbnail_url}
            alt=""
            loading="lazy"
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-muted-foreground">
            <PlayCircle className="h-10 w-10" aria-hidden />
          </div>
        )}
        <div className="absolute inset-0 flex items-center justify-center bg-black/20 opacity-0 transition-opacity group-hover:opacity-100">
          <PlayCircle className="h-12 w-12 text-white drop-shadow" aria-hidden />
        </div>
      </div>
      <div className="mt-2 flex items-start gap-1.5">
        <p className="line-clamp-2 flex-1 text-sm font-semibold text-foreground">
          {highlight.title}
        </p>
      </div>
      <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
        Se på SVT <ExternalLink className="h-3 w-3" aria-hidden />
      </p>
    </>
  );

  if (!href) {
    return <div className="group block w-[240px] shrink-0">{inner}</div>;
  }

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="group block w-[240px] shrink-0 transition-opacity hover:opacity-95"
    >
      {inner}
    </a>
  );
}
