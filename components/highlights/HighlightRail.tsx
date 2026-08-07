import { Film } from "lucide-react";
import type { Highlight } from "@/lib/highlights/queries";
import { HighlightCard } from "./HighlightCard";

/**
 * Horisontell rad av höjdpunkts-kort. Renderar inget om det saknas klipp
 * (ingen tom yta). Används i hub/mitt-lag och lag-sida.
 */
export function HighlightRail({
  highlights,
  title = "Höjdpunkter",
}: {
  highlights: Highlight[];
  title?: string;
}) {
  if (!highlights.length) return null;

  return (
    <section className="rounded-2xl border border-border bg-card px-5 py-4">
      <div className="mb-3 flex items-center gap-2">
        <Film className="h-4 w-4 text-muted-foreground" aria-hidden />
        <h2 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground text-balance">
          {title}
        </h2>
      </div>
      <div className="-mx-1 flex gap-3 overflow-x-auto px-1 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {highlights.map((h) => (
          <HighlightCard key={h.id} highlight={h} />
        ))}
      </div>
    </section>
  );
}
