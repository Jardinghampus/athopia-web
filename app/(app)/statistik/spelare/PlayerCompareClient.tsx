"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Users } from "lucide-react";
import dynamic from "next/dynamic";
import type { PlayerRadarSeries } from "@/components/team-hub/PlayerRadar";

// recharts är tungt — ladda radarn först när en spelare valts
const PlayerRadar = dynamic(
  () => import("@/components/team-hub/PlayerRadar").then((m) => m.PlayerRadar),
  { ssr: false, loading: () => <div className="h-64 rounded-xl skeleton-wave bg-muted/40" /> }
);
import { SCOUT_METRICS, type ScoutPlayer, type ScoutMetricKey } from "@/lib/team-hub/scout";

const RADAR_METRICS: ScoutMetricKey[] = ["goals", "assists", "xg", "xa", "shots", "rating"];
const COLOR_A = "#1D9E75";
const COLOR_B = "#3B82F6";

/** Percentilrank (0–100) för ett värde inom poolen. */
function percentile(values: number[], v: number): number {
  if (values.length === 0) return 50;
  const below = values.filter((x) => x < v).length;
  const equal = values.filter((x) => x === v).length;
  return Math.round(((below + equal / 2) / values.length) * 100);
}

function PlayerPicker({ pool, value, onChange, label, color }: {
  pool: ScoutPlayer[]; value: string; onChange: (v: string) => void; label: string; color: string;
}) {
  return (
    <div className="space-y-1">
      <span className="text-xs font-semibold" style={{ color }}>{label}</span>
      <select value={value} onChange={(e) => onChange(e.target.value)} aria-label={label}
        className="w-full text-sm bg-background border border-border rounded-lg px-2.5 min-h-11 sm:min-h-9 text-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-ring cursor-pointer">
        <option value="">Välj spelare…</option>
        {pool.map((p) => (
          <option key={p.player_id} value={String(p.player_id)}>{p.fullname} · {p.team_name}</option>
        ))}
      </select>
    </div>
  );
}

export function PlayerCompareClient({ pool }: { pool: ScoutPlayer[] }) {
  const ranked = useMemo(() => [...pool].sort((a, b) => a.fullname.localeCompare(b.fullname, "sv")), [pool]);
  const [idA, setIdA] = useState("");
  const [idB, setIdB] = useState("");

  // Poolvärden per metric (endast spelare med speltid) → normaliseringsbas.
  const cols = useMemo(() => {
    const out = {} as Record<ScoutMetricKey, number[]>;
    const active = pool.filter((p) => p.minutes > 0);
    for (const m of SCOUT_METRICS) out[m.key] = active.map((p) => p[m.key]);
    return out;
  }, [pool]);

  const playerA = pool.find((p) => String(p.player_id) === idA) ?? null;
  const playerB = pool.find((p) => String(p.player_id) === idB) ?? null;

  function toSeries(p: ScoutPlayer, name: string, color: string): PlayerRadarSeries {
    return {
      name, color,
      values: RADAR_METRICS.map((key) => {
        const label = SCOUT_METRICS.find((m) => m.key === key)?.label ?? key;
        return { metric: label, value: percentile(cols[key], p[key]), raw: p[key] };
      }),
    };
  }

  const series: PlayerRadarSeries[] = [];
  if (playerA) series.push(toSeries(playerA, playerA.fullname, COLOR_A));
  if (playerB) series.push(toSeries(playerB, playerB.fullname, COLOR_B));

  const fmt = (k: ScoutMetricKey, v: number) => (k === "xg" || k === "xa" || k === "rating" ? v.toFixed(2) : v);

  return (
    <div className="space-y-5">
      <div className="rounded-2xl border border-border bg-card p-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
        <PlayerPicker pool={ranked} value={idA} onChange={setIdA} label="Spelare A" color={COLOR_A} />
        <PlayerPicker pool={ranked} value={idB} onChange={setIdB} label="Spelare B" color={COLOR_B} />
      </div>

      {!playerA && !playerB ? (
        <div className="text-center py-16 text-muted-foreground">
          <Users className="h-8 w-8 mx-auto mb-2 opacity-50" />
          <p className="text-sm">Välj en eller två spelare att jämföra mot ligan.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {/* Radar */}
          <div className="rounded-2xl border border-border bg-card p-4">
            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-2">Profil (percentil vs ligan)</h2>
            <PlayerRadar series={series} />
            <p className="text-[11px] text-muted-foreground text-center mt-1">100 = bäst i ligan, 50 = median.</p>
          </div>

          {/* Stat-rader */}
          <div className="rounded-2xl border border-border bg-card p-4">
            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">Råvärden</h2>
            <div className="grid grid-cols-3 items-center py-2 border-b border-border/60 text-xs text-muted-foreground">
              <span className="text-right pr-4 font-semibold" style={{ color: COLOR_A }}>{playerA?.fullname ?? "—"}</span>
              <span className="text-center">Mätvärde</span>
              <span className="text-left pl-4 font-semibold" style={{ color: COLOR_B }}>{playerB?.fullname ?? "—"}</span>
            </div>
            {SCOUT_METRICS.map((m) => {
              const a = playerA ? playerA[m.key] : null;
              const b = playerB ? playerB[m.key] : null;
              const aWins = a != null && b != null && a > b;
              const bWins = a != null && b != null && b > a;
              return (
                <div key={m.key} className="grid grid-cols-3 items-center py-2 border-b border-border/40 last:border-0">
                  <span className={`text-sm font-semibold text-right pr-4 ${aWins ? "text-pitch" : "text-foreground"}`}>{a != null ? fmt(m.key, a) : "—"}</span>
                  <span className="text-xs text-center text-muted-foreground">{m.label}</span>
                  <span className={`text-sm font-semibold text-left pl-4 ${bWins ? "text-blue-400" : "text-foreground"}`}>{b != null ? fmt(m.key, b) : "—"}</span>
                </div>
              );
            })}
            <div className="grid grid-cols-3 items-center pt-3 text-xs">
              <Link href={playerA ? `/spelare/${playerA.slug ?? playerA.player_id}` : "#"} className="text-right pr-4 text-muted-foreground hover:text-pitch">{playerA ? "Profil →" : ""}</Link>
              <span />
              <Link href={playerB ? `/spelare/${playerB.slug ?? playerB.player_id}` : "#"} className="text-left pl-4 text-muted-foreground hover:text-blue-400">{playerB ? "Profil →" : ""}</Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
