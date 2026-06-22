"use client";

import { useMemo, useState } from "react";
import { Search, SlidersHorizontal } from "lucide-react";
import { SCOUT_METRICS, median, type ScoutPlayer, type ScoutMetricKey } from "@/lib/team-hub/scout";
import { SegmentedControl } from "@/components/ui/SegmentedControl";
import { ListGroup } from "@/components/ui/ListGroup";
import { ListRow } from "@/components/ui/ListRow";
import { Sheet, SheetContent, SheetTitle, SheetClose } from "@/components/ui/TactileSheet";

const POSITIONS = [
  { id: "all", label: "Alla positioner" },
  { id: "goalkeeper", label: "Målvakter" },
  { id: "defender", label: "Försvarare" },
  { id: "midfielder", label: "Mittfältare" },
  { id: "attacker", label: "Anfallare" },
];

interface Filters {
  position: string;
  metrics: ScoutMetricKey[];
  aboveMedian: boolean;
  minMinutes: number;
}

/** Filterkontroller — delas mellan inline-panelen (desktop) och Sheet (mobil). */
function FilterControls({ f, set }: { f: Filters; set: (patch: Partial<Filters>) => void }) {
  const selectClass =
    "w-full text-sm bg-background border border-border rounded-lg px-2.5 min-h-11 sm:min-h-9 text-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-ring cursor-pointer";
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
      <label className="text-xs text-muted-foreground space-y-1">
        <span>Position (medianreferens)</span>
        <select value={f.position} onChange={(e) => set({ position: e.target.value })} className={selectClass}>
          {POSITIONS.map((p) => <option key={p.id} value={p.id}>{p.label}</option>)}
        </select>
      </label>

      <div className="text-xs text-muted-foreground space-y-1">
        <span>Mätvärden</span>
        <div className="grid max-h-36 grid-cols-2 gap-1 overflow-y-auto rounded-lg border border-border bg-background p-2">
          {SCOUT_METRICS.map((m) => {
            const checked = f.metrics.includes(m.key);
            return (
              <label key={m.key} className="flex min-h-8 items-center gap-2 rounded-md px-2 text-xs text-foreground hover:bg-muted/50">
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={() => {
                    const next = checked
                      ? f.metrics.filter((key) => key !== m.key)
                      : [...f.metrics, m.key];
                    set({ metrics: next.length ? next : [m.key] });
                  }}
                  className="size-4 accent-pitch"
                />
                <span>{m.label}</span>
              </label>
            );
          })}
        </div>
      </div>

      <div className="text-xs text-muted-foreground space-y-1">
        <span>Riktning</span>
        <SegmentedControl
          aria-label="Riktning"
          options={[
            { value: "above", label: "Över median" },
            { value: "below", label: "Under median" },
          ]}
          value={f.aboveMedian ? "above" : "below"}
          onChange={(v) => set({ aboveMedian: v === "above" })}
        />
      </div>

      <label className="text-xs text-muted-foreground space-y-1">
        <span>Min. speltid: {f.minMinutes}′</span>
        <input
          type="range" min={0} max={1500} step={90} value={f.minMinutes}
          onChange={(e) => set({ minMinutes: Number(e.target.value) })}
          className="w-full accent-pitch min-h-11 sm:min-h-9"
        />
      </label>
    </div>
  );
}

export function ScoutClient({ pool }: { pool: ScoutPlayer[] }) {
  const [filters, setFilters] = useState<Filters>({
    position: "all",
    metrics: ["shots"],
    aboveMedian: true,
    minMinutes: 0,
  });
  const [query, setQuery] = useState("");
  const [sheetOpen, setSheetOpen] = useState(false);
  const set = (patch: Partial<Filters>) => setFilters((f) => ({ ...f, ...patch }));
  const { position, metrics, aboveMedian, minMinutes } = filters;

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
    const activeMetrics: ScoutMetricKey[] = metrics.length ? metrics : ["shots"];
    return cohort
      .filter((p) => p.minutes >= minMinutes)
      .filter((p) => (query ? p.fullname.toLowerCase().includes(query.toLowerCase()) : true))
      .filter((p) =>
        activeMetrics.every((metric) =>
          aboveMedian ? p[metric] >= medians[metric] : p[metric] <= medians[metric],
        ),
      )
      .sort((a, b) => {
        const score = (p: ScoutPlayer) =>
          activeMetrics.reduce((sum, metric) => {
            const ref = medians[metric] || 1;
            const delta = (p[metric] - medians[metric]) / Math.max(1, Math.abs(ref));
            return sum + delta;
          }, 0);
        return aboveMedian ? score(b) - score(a) : score(a) - score(b);
      });
  }, [cohort, metrics, medians, aboveMedian, minMinutes, query]);

  const metricLabels = metrics
    .map((metric) => SCOUT_METRICS.find((m) => m.key === metric)?.label ?? metric)
    .join(", ");
  const fmtMetric = (metric: ScoutMetricKey, v: number) => (metric === "rating" || metric === "xg" || metric === "xa" ? v.toFixed(2) : v);
  const filterActive = position !== "all" || metrics.length !== 1 || metrics[0] !== "shots" || !aboveMedian || minMinutes > 0;

  const summary = (
    <p className="text-xs text-muted-foreground">
      Visar spelare <strong className="text-foreground">{aboveMedian ? "över" : "under"}</strong> {position === "all" ? "liga" : "positions"}median i{" "}
      <strong className="text-foreground">{metricLabels}</strong> ·{" "}
      <strong className="text-pitch">{results.length}</strong> träffar
    </p>
  );

  return (
    <div className="space-y-5">
      {/* Sök + filterknapp (mobil) */}
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" aria-hidden />
          <input
            value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Sök spelare…"
            aria-label="Sök spelare"
            className="w-full text-sm bg-card border border-border rounded-xl pl-9 pr-3 min-h-11 text-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
        </div>
        <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
          <button
            onClick={() => setSheetOpen(true)}
            aria-label="Scout-filter"
            className={`sm:hidden inline-flex shrink-0 items-center gap-1.5 rounded-xl border px-3.5 min-h-11 text-sm font-medium transition-colors touch-manipulation ${
              filterActive ? "border-pitch/40 bg-pitch/10 text-pitch" : "border-border text-muted-foreground"
            }`}
          >
            <SlidersHorizontal className="h-4 w-4" />
          </button>
          <SheetContent>
            <div className="space-y-5 pb-4">
              <SheetTitle>Scout-filter</SheetTitle>
              <FilterControls f={filters} set={set} />
              {summary}
              <SheetClose asChild>
                <button className="w-full rounded-xl bg-pitch px-4 py-3 text-sm font-medium text-white transition-opacity active:opacity-80">
                  Visa {results.length} träffar
                </button>
              </SheetClose>
            </div>
          </SheetContent>
        </Sheet>
      </div>

      {/* Inline filter-panel (desktop) */}
      <div className="hidden sm:block rounded-2xl border border-border bg-card p-4 space-y-4">
        <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
          <SlidersHorizontal className="h-4 w-4 text-pitch" /> Scout-filter
        </div>
        <FilterControls f={filters} set={set} />
        {summary}
      </div>

      {/* Resultat */}
      {results.length === 0 ? (
        <div className="py-12 text-center space-y-2">
          <p className="text-sm text-muted-foreground">Inga spelare matchar filtret.</p>
          <button
            onClick={() => { setFilters({ position: "all", metrics: ["shots"], aboveMedian: true, minMinutes: 0 }); setQuery(""); }}
            className="text-sm text-pitch hover:underline"
          >
            Återställ filter
          </button>
        </div>
      ) : (
        <ListGroup
          className="max-w-3xl"
          header={`${metricLabels} — ${aboveMedian ? "över" : "under"} median`}
          footer={`Alla valda mätvärden måste passera ${position === "all" ? "ligans" : "positionens"} median.`}
        >
          {results.slice(0, 60).map((p, i) => {
            const primaryMetric: ScoutMetricKey = metrics[0] ?? "shots";
            const delta = p[primaryMetric] - medians[primaryMetric];
            return (
              <ListRow
                key={`${p.player_id}-${i}`}
                href={`/spelare/${p.slug ?? p.player_id}`}
                leading={<span className="text-xs tabular-nums text-muted-foreground">{i + 1}</span>}
                title={p.fullname}
                subtitle={`${p.team_name} · ${p.position?.slice(0, 3) ?? "–"} · ${p.minutes}′`}
                trailing={
                  <span className="tabular-nums">
                    <span className="font-bold text-foreground">{fmtMetric(primaryMetric, p[primaryMetric])}</span>
                    <span className={`ml-1.5 text-[11px] ${delta >= 0 ? "text-pitch" : "text-red-400"}`}>
                      {delta >= 0 ? "+" : ""}{fmtMetric(primaryMetric, delta)}
                    </span>
                  </span>
                }
              />
            );
          })}
        </ListGroup>
      )}
    </div>
  );
}
