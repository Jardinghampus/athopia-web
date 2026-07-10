"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Search, Loader2 } from "lucide-react";

interface EpisodeHit {
  id: string;
  title: string;
  showName: string | null;
  publishedAt: string | null;
  mentionedTeams: string[];
}

/** Debounced sök mot /api/podcast-search (metadata only — rättighetspolicy). */
export function PodcastSearch() {
  const [q, setQ] = useState("");
  const [hits, setHits] = useState<EpisodeHit[] | null>(null);
  const [loading, setLoading] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (timer.current) clearTimeout(timer.current);
    const query = q.trim();
    if (query.length < 2) {
      setHits(null);
      return;
    }
    timer.current = setTimeout(() => {
      setLoading(true);
      void fetch(`/api/podcast-search?q=${encodeURIComponent(query)}`)
        .then((r) => r.json())
        .then((d: { episodes?: EpisodeHit[] }) => setHits(d.episodes ?? []))
        .catch(() => setHits([]))
        .finally(() => setLoading(false));
    }, 300);
    return () => { if (timer.current) clearTimeout(timer.current); };
  }, [q]);

  return (
    <div>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <input
          type="search"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Sök avsnitt, podd eller lag …"
          className="w-full rounded-xl border border-border bg-card pl-9 pr-9 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-pitch/40"
          aria-label="Sök poddavsnitt"
        />
        {loading && (
          <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 animate-spin text-muted-foreground" />
        )}
      </div>

      {hits !== null && (
        <div className="mt-3 rounded-xl border border-border bg-card divide-y divide-border/60">
          {hits.length === 0 && !loading ? (
            <p className="px-4 py-6 text-sm text-muted-foreground text-center">
              Inga avsnitt matchade — prova ett lagnamn eller poddens namn.
            </p>
          ) : (
            hits.map((ep) => (
              <Link
                key={ep.id}
                href={`/podcast/${ep.id}`}
                className="block px-4 py-3 hover:bg-muted/40 transition-colors"
              >
                <p className="text-sm font-medium text-foreground line-clamp-1">{ep.title}</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {ep.showName}
                  {ep.publishedAt && ` · ${new Date(ep.publishedAt).toLocaleDateString("sv-SE")}`}
                  {ep.mentionedTeams.length > 0 && ` · ${ep.mentionedTeams.slice(0, 3).join(", ")}`}
                </p>
              </Link>
            ))
          )}
        </div>
      )}
    </div>
  );
}
