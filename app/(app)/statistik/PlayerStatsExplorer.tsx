"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import type { ScorerRow } from "@/lib/statistik";

const METRICS: Array<{ key: keyof ScorerRow; label: string; decimals?: number }> = [
  { key: "rating", label: "Betyg", decimals: 2 },
  { key: "goals", label: "Mål" },
  { key: "assists", label: "Assist" },
  { key: "xg", label: "xG", decimals: 2 },
  { key: "xa", label: "xA", decimals: 2 },
  { key: "shots", label: "Skott" },
  { key: "shots_on_target", label: "Skott på mål" },
  { key: "key_passes", label: "Nyckelpass" },
  { key: "passes", label: "Passningar" },
  { key: "tackles", label: "Tacklingar" },
  { key: "interceptions", label: "Brytningar" },
  { key: "minutes", label: "Minuter" },
];

function numeric(row: ScorerRow, key: keyof ScorerRow) {
  const value = row[key];
  return typeof value === "number" && Number.isFinite(value) ? value : -1;
}

export function PlayerStatsExplorer({ players }: { players: ScorerRow[] }) {
  const [team, setTeam] = useState("all");
  const [position, setPosition] = useState("all");
  const [metric, setMetric] = useState<keyof ScorerRow>("rating");

  const teams = useMemo(() => Array.from(new Set(players.map((p) => p.team_name))).sort((a, b) => a.localeCompare(b, "sv")), [players]);
  const positions = useMemo(() => Array.from(new Set(players.map((p) => p.position).filter(Boolean))) as string[], [players]);
  const metricDef = METRICS.find((item) => item.key === metric) ?? METRICS[0];

  const rows = useMemo(() => {
    return players
      .filter((player) => team === "all" || player.team_name === team)
      .filter((player) => position === "all" || player.position === position)
      .sort((a, b) => numeric(b, metric) - numeric(a, metric))
      .slice(0, 50);
  }, [players, team, position, metric]);

  const fmt = (value: number | null | undefined, decimals = 0) => {
    if (value == null || !Number.isFinite(value)) return "-";
    return value.toLocaleString("sv-SE", { maximumFractionDigits: decimals, minimumFractionDigits: decimals });
  };

  return (
    <section className="rounded-2xl border border-border bg-card p-4">
      <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Utforska spelarstats</h2>
          <p className="mt-1 text-xs text-muted-foreground">Filtrera efter lag och position. Sorteras högst till lägst.</p>
        </div>
        <div className="grid gap-2 sm:grid-cols-3 lg:w-[620px]">
          <select value={team} onChange={(e) => setTeam(e.target.value)} className="h-10 rounded-lg border border-border bg-background px-3 text-sm">
            <option value="all">Alla lag</option>
            {teams.map((name) => <option key={name} value={name}>{name}</option>)}
          </select>
          <select value={position} onChange={(e) => setPosition(e.target.value)} className="h-10 rounded-lg border border-border bg-background px-3 text-sm">
            <option value="all">Alla positioner</option>
            {positions.map((name) => <option key={name} value={name}>{name}</option>)}
          </select>
          <select value={String(metric)} onChange={(e) => setMetric(e.target.value as keyof ScorerRow)} className="h-10 rounded-lg border border-border bg-background px-3 text-sm">
            {METRICS.map((item) => <option key={String(item.key)} value={String(item.key)}>{item.label}</option>)}
          </select>
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[680px] text-sm">
          <thead>
            <tr className="border-b border-border text-xs uppercase tracking-wider text-muted-foreground">
              <th className="px-3 py-2 text-left">#</th>
              <th className="px-3 py-2 text-left">Spelare</th>
              <th className="px-3 py-2 text-left">Lag</th>
              <th className="px-3 py-2 text-center">Pos</th>
              <th className="px-3 py-2 text-center">Min</th>
              <th className="px-3 py-2 text-center text-foreground">{metricDef.label}</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, index) => (
              <tr key={row.player_id} className="border-b border-border/40 last:border-0">
                <td className="px-3 py-2 text-muted-foreground">{index + 1}</td>
                <td className="px-3 py-2 font-medium">
                  <Link href={`/spelare/${row.slug ?? row.player_id}`} className="hover:text-pitch">{row.player_name}</Link>
                </td>
                <td className="px-3 py-2 text-muted-foreground">{row.team_name}</td>
                <td className="px-3 py-2 text-center text-muted-foreground">{row.position?.slice(0, 3) ?? "-"}</td>
                <td className="px-3 py-2 text-center text-muted-foreground tabular-nums">{row.minutes}</td>
                <td className="px-3 py-2 text-center font-bold tabular-nums text-foreground">
                  {fmt(row[metric] as number | null | undefined, metricDef.decimals)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
