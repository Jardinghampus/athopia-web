"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Search, SlidersHorizontal, ArrowUpDown } from "lucide-react";
import { SCOUT_METRICS, median, type ScoutPlayer, type ScoutMetricKey } from "@/lib/team-hub/scout";

const POSITIONS = [
  { id: "all", label: "Alla positioner" },
  { id: "goalkeeper", label: "Målvakter" },
  { id: "defender", label: "Försvarare" },
  { id: "midfielder", label: "Mittfältare" },
  { id: "attacker", label: "Anfallare" },
];

export function ScoutClient({ pool }: { pool: ScoutPlayer[] }) {
  const [position, setPosition] = useState("all");
  const [metric, setMetric] = useState<ScoutMetricKey>("xg");
  const [aboveMedian, setAboveMedian] = useState(true);
  const [minMinutes, setMinMinutes] = useState(0);
  const [query, setQuery] = useState("");

  // Jämförelsegrupp = ligan, eller positionen om vald → positionsmedian.
  const cohort = useMemo(
    () => pool.filter((p) => position === "all" || p.position === position),
    [pool, position]
  );

  const medians = useMemo(() => {
    const out = {} as Record<ScoutMetricKey, number>;
    for (const m of SCOUT_METRICS) out[m.key] = median(cohort.map((p) => p[m.key]));
    return out;
  }, [cohort]);

  const results = useMemo(() => {
    const ref = medians[metric];
    return cohort
      .filter((p) => p.minutes >= minMinutes)
      .filter((p) => (query ? p.fullname.toLowerCase().includes(query.toLowerCase()) : true))
      .filter((p) => (aboveMedian ? p[metric] >= ref : p[metric] <= ref))
      .sort((a, b) => (aboveMedian ? b[metric] - a[metric] : a[metric] - b[metric]));
  }, [cohort, metric, medians, aboveMedian, minMinutes, query]);

  const metricLabel = SCOUT_METRICS.find((m) => m.key === metric)?.label ?? metric;
  const fmt = (v: number) => (metric === "xg" || metric === "xa" || metric === "rating" ? v.toFixed(2) : v);

  return (
    <div className="space-y-5">
      {/* Filter-panel */}
      <div className="rounded-2xl border border-border bg-card p-4 space-y-4">
        <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
          <SlidersHorizontal className="h-4 w-4 text-pitch" /> Scout-filter
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <label className="text-xs text-muted-foreground space-y-1">
            <span>Position (medianreferens)</span>
            <select value={position} onChange={(e) => setPosition(e.target.value)}
              className="w-full text-sm bg-background border border-border rounded-lg px-2.5 py-1.5 text-foreground">
              {POSITIONS.map((p) => <option key={p.id} value={p.id}>{p.label}</option>)}
            </select>
          </label>

          <label className="text-xs text-muted-foreground space-y-1">
            <span>Mätvärde</span>
            <select value={metric} onChange={(e) => setMetric(e.target.value as ScoutMetricKey)}
              className="w-full text-sm bg-background border border-border rounded-lg px-2.5 py-1.5 text-foreground">
              {SCOUT_METRICS.map((m) => <option key={m.key} value={m.key}>{m.label}</option>)}
            </select>
          </label>

          <label className="text-xs text-muted-foreground space-y-1">
            <span>Riktning</span>
            <select value={aboveMedian ? "above" : "below"} onChange={(e) => setAboveMedian(e.target.value === "above")}
              className="w-full text-sm bg-background border border-border rounded-lg px-2.5 py-1.5 text-foreground">
              <option value="above">Över median</option>
              <option value="below">Under median</option>
            </select>
          </label>

          <label className="text-xs text-muted-foreground space-y-1">
            <span>Min. speltid: {minMinutes}′</span>
            <input type="range" min={0} max={1500} step={90} value={minMinutes}
              onChange={(e) => setMinMinutes(Number(e.target.value))}
              className="w-full accent-pitch" />
          </label>
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Sök spelare…"
            className="w-full text-sm bg-background border border-border rounded-lg pl-9 pr-3 py-2 text-foreground" />
        </div>

        <p className="text-xs text-muted-foreground">
          Visar spelare <strong className="text-foreground">{aboveMedian ? "över" : "under"}</strong> {position === "all" ? "liga" : "positions"}median i{" "}
          <strong className="text-foreground">{metricLabel}</strong> ({fmt(medians[metric])}) ·{" "}
          <strong className="text-pitch">{results.length}</strong> träffar
        </p>
      </div>

      {/* Resultat */}
      {results.length === 0 ? (
        <p className="text-sm text-muted-foreground py-10 text-center">Inga spelare matchar filtret.</p>
      ) : (
        <div className="rounded-2xl border border-border bg-card overflow-x-auto">
          <table className="w-full text-sm min-w-[640px]">
            <thead>
              <tr className="border-b border-border bg-muted/40 text-xs text-muted-foreground">
                <th className="text-left px-4 py-2.5">#</th>
                <th className="text-left px-4 py-2.5">Spelare</th>
                <th className="text-left px-3 py-2.5">Lag</th>
                <th className="text-center px-3 py-2.5">Pos</th>
                <th className="text-center px-3 py-2.5">Min</th>
                <th className="text-center px-3 py-2.5">
                  <span className="inline-flex items-center gap-1 text-pitch font-semibold">
                    {metricLabel} <ArrowUpDown className="h-3 w-3" />
                  </span>
                </th>
              </tr>
            </thead>
            <tbody>
              {results.slice(0, 60).map((p, i) => {
                const delta = p[metric] - medians[metric];
                return (
                  <tr key={`${p.player_id}-${i}`} className="border-b border-border/40 last:border-0 hover:bg-muted/20">
                    <td className="px-4 py-2.5 text-muted-foreground">{i + 1}</td>
                    <td className="px-4 py-2.5">
                      <Link href={`/spelare/${p.slug ?? p.player_id}`} className="text-foreground hover:text-pitch">{p.fullname}</Link>
                    </td>
                    <td className="px-3 py-2.5 text-muted-foreground truncate max-w-[140px]">{p.team_name}</td>
                    <td className="px-3 py-2.5 text-center text-muted-foreground capitalize">{p.position?.slice(0, 3) ?? "–"}</td>
                    <td className="px-3 py-2.5 text-center text-muted-foreground">{p.minutes}′</td>
                    <td className="px-3 py-2.5 text-center">
                      <span className="font-bold text-foreground">{fmt(p[metric])}</span>
                      <span className={`ml-1.5 text-[11px] ${delta >= 0 ? "text-pitch" : "text-red-400"}`}>
                        {delta >= 0 ? "+" : ""}{fmt(delta)}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
