"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Search, CornerDownLeft } from "lucide-react";
import { useCommandPalette } from "@/hooks/useCommandPalette";
import { useLocalStorage } from "@/hooks/useLocalStorage";
import { cn } from "@/lib/utils";

type SearchResult = {
  articles: Array<{ id: string; slug: string; title: string }>;
  teams: Array<{ id: string; slug: string; name: string }>;
  players: Array<{ id: string; slug: string; name: string }>;
  podcasts: Array<{ id: string; title: string }>;
};

export function CommandPalette() {
  const { open, close, query, setQuery } = useCommandPalette();
  const [recent, setRecent] = useLocalStorage<string[]>("athopia.recentSearches", []);
  const [results, setResults] = useState<SearchResult | null>(null);
  const [loading, setLoading] = useState(false);

  const trimmed = query.trim();
  const suggestions = useMemo(() => {
    if (trimmed) return [];
    return recent.slice(0, 6);
  }, [recent, trimmed]);

  useEffect(() => {
    if (!open) return;
    setResults(null);
    setLoading(false);
  }, [open]);

  useEffect(() => {
    let alive = true;
    if (!open) return;
    if (!trimmed) {
      setResults(null);
      return;
    }

    setLoading(true);
    const t = setTimeout(async () => {
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(trimmed)}`);
        const json = (await res.json()) as SearchResult;
        if (!alive) return;
        setResults(json);
      } catch {
        if (!alive) return;
        setResults({ articles: [], teams: [], players: [], podcasts: [] });
      } finally {
        if (!alive) return;
        setLoading(false);
      }
    }, 200);

    return () => {
      alive = false;
      clearTimeout(t);
    };
  }, [open, trimmed]);

  if (!open) return null;

  const onSubmit = () => {
    const q = trimmed;
    if (!q) return;
    setRecent((prev) => [q, ...prev.filter((x) => x !== q)].slice(0, 10));
  };

  return (
    <div className="fixed inset-0 z-[100]">
      <button className="absolute inset-0 bg-black/55" onClick={close} aria-label="Stäng sök" />
      <div className="absolute left-1/2 top-16 -translate-x-1/2 w-[92vw] max-w-2xl">
        <div className="glass rounded-2xl overflow-hidden">
          <div className="flex items-center gap-3 p-4 border-b border-white/10">
            <Search className="w-4 h-4 text-muted-foreground" />
            <input
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") onSubmit();
              }}
              placeholder="Sök artiklar, lag, spelare, podcasts…"
              className="w-full bg-transparent outline-none text-sm text-foreground placeholder:text-muted-foreground"
            />
            <span className="text-xs text-muted-foreground flex items-center gap-1">
              <CornerDownLeft className="w-3 h-3" /> Enter
            </span>
          </div>

          <div className="p-4 max-h-[60vh] overflow-auto">
            {!trimmed && suggestions.length > 0 && (
              <div>
                <div className="text-xs text-muted-foreground mb-2">Senaste sökningar</div>
                <div className="flex flex-wrap gap-2">
                  {suggestions.map((s) => (
                    <button
                      key={s}
                      onClick={() => setQuery(s)}
                      className="px-3 py-1 rounded-full border border-white/10 bg-white/5 text-xs text-foreground hover:border-pitch/30"
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {trimmed && (
              <div className="space-y-6">
                <Section title="Artiklar">
                  <ResultList
                    items={results?.articles ?? []}
                    loading={loading}
                    empty="Inga artiklar matchade."
                    render={(a) => (
                      <Link href={`/app/artikel/${a.slug}`} onClick={close} className={itemClass}>
                        {a.title}
                      </Link>
                    )}
                  />
                </Section>

                <Section title="Lag">
                  <ResultList
                    items={results?.teams ?? []}
                    loading={loading}
                    empty="Inga lag matchade."
                    render={(t) => (
                      <Link href={`/app/lag/${t.slug}`} onClick={close} className={itemClass}>
                        {t.name}
                      </Link>
                    )}
                  />
                </Section>

                <Section title="Spelare">
                  <ResultList
                    items={results?.players ?? []}
                    loading={loading}
                    empty="Inga spelare matchade."
                    render={(p) => (
                      <Link href={`/app/spelare/${p.slug}`} onClick={close} className={itemClass}>
                        {p.name}
                      </Link>
                    )}
                  />
                </Section>

                <Section title="Podcasts">
                  <ResultList
                    items={results?.podcasts ?? []}
                    loading={loading}
                    empty="Inga podcasts matchade."
                    render={(p) => (
                      <Link href={`/app/podcast/${p.id}`} onClick={close} className={itemClass}>
                        {p.title}
                      </Link>
                    )}
                  />
                </Section>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="text-xs text-muted-foreground mb-2">{title}</div>
      {children}
    </div>
  );
}

const itemClass =
  "block w-full text-left px-3 py-2 rounded-xl border border-white/10 bg-white/5 hover:border-pitch/30 transition-colors text-sm text-foreground";

function ResultList<T>({
  items,
  loading,
  empty,
  render,
}: {
  items: T[];
  loading: boolean;
  empty: string;
  render: (item: T) => React.ReactNode;
}) {
  if (loading) {
    return <div className={cn(itemClass, "opacity-70")}>Söker…</div>;
  }
  if (items.length === 0) {
    return <div className={cn(itemClass, "opacity-60")}>{empty}</div>;
  }
  return <div className="space-y-2">{items.slice(0, 6).map((it, idx) => <div key={idx}>{render(it)}</div>)}</div>;
}

