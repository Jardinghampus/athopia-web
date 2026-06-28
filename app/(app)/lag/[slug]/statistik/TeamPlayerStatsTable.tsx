"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { ArrowDownUp, Search } from "lucide-react";

export type TeamPlayerStat = {
  player_id: number;
  fullname: string;
  slug: string;
  position: string | null;
  appearances: number;
  goals: number;
  assists: number;
  shots: number;
  shots_on_target: number;
  passes: number;
  tackles: number;
  interceptions: number;
  rating: number | null;
  yellow_cards: number;
  red_cards: number;
};

const COLUMNS: Array<{ key: keyof TeamPlayerStat; label: string; numeric?: boolean }> = [
  { key: "appearances", label: "M", numeric: true },
  { key: "goals", label: "Mål", numeric: true },
  { key: "assists", label: "Ast", numeric: true },
  { key: "shots", label: "Skott", numeric: true },
  { key: "shots_on_target", label: "Sk. mål", numeric: true },
  { key: "passes", label: "Pass", numeric: true },
  { key: "tackles", label: "Tackl", numeric: true },
  { key: "interceptions", label: "Bry", numeric: true },
  { key: "rating", label: "Betyg", numeric: true },
  { key: "yellow_cards", label: "Gula", numeric: true },
  { key: "red_cards", label: "Röda", numeric: true },
];

export function TeamPlayerStatsTable({ players }: { players: TeamPlayerStat[] }) {
  const [query, setQuery] = useState("");
  const [position, setPosition] = useState("all");
  const [sortKey, setSortKey] = useState<keyof TeamPlayerStat>("goals");
  const [direction, setDirection] = useState<"desc" | "asc">("desc");

  const positions = useMemo(
    () => Array.from(new Set(players.map((p) => p.position).filter(Boolean))).sort() as string[],
    [players],
  );

  const rows = useMemo(() => {
    return players
      .filter((player) => position === "all" || player.position === position)
      .filter((player) => player.fullname.toLowerCase().includes(query.toLowerCase()))
      .sort((a, b) => {
        const av = a[sortKey];
        const bv = b[sortKey];
        const aNum = typeof av === "number" ? av : av == null ? -1 : String(av).localeCompare("");
        const bNum = typeof bv === "number" ? bv : bv == null ? -1 : String(bv).localeCompare("");
        const diff = typeof aNum === "number" && typeof bNum === "number"
          ? aNum - bNum
          : String(av ?? "").localeCompare(String(bv ?? ""), "sv");
        return direction === "asc" ? diff : -diff;
      });
  }, [players, position, query, sortKey, direction]);

  const toggleSort = (key: keyof TeamPlayerStat) => {
    if (sortKey === key) setDirection((current) => (current === "desc" ? "asc" : "desc"));
    else {
      setSortKey(key);
      setDirection("desc");
    }
  };

  return (
    <div className="rounded-2xl border border-border bg-card">
      <div className="space-y-3 border-b border-border px-4 py-3">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h3 className="font-semibold text-sm text-foreground">ALL SPELARSTATISTIK</h3>
          <div className="flex flex-col gap-2 sm:flex-row">
            <label className="relative">
              <Search className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Sök spelare"
                className="h-9 w-full rounded-lg border border-border bg-background pl-8 pr-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring sm:w-48"
              />
            </label>
            <select
              value={position}
              onChange={(event) => setPosition(event.target.value)}
              className="h-9 rounded-lg border border-border bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <option value="all">Alla positioner</option>
              {positions.map((pos) => (
                <option key={pos} value={pos}>
                  {pos}
                </option>
              ))}
            </select>
          </div>
        </div>
        <p className="text-xs text-muted-foreground">
          Klicka på kolumnrubrikerna för att sortera högt/lågt.
        </p>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm min-w-[760px]">
          <thead>
            <tr className="border-b border-border bg-muted/40">
              <th className="text-left px-4 py-2 text-xs text-muted-foreground">Spelare</th>
              <th className="text-center px-3 py-2 text-xs text-muted-foreground">Pos</th>
              {COLUMNS.map((column) => (
                <th key={column.key} className="px-3 py-2 text-center text-xs text-muted-foreground">
                  <button
                    onClick={() => toggleSort(column.key)}
                    className="inline-flex items-center justify-center gap-1 rounded px-1 py-0.5 hover:text-foreground"
                  >
                    {column.label}
                    <ArrowDownUp className="size-3" />
                  </button>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.player_id} className="border-b border-border/40 last:border-0 hover:bg-muted/20 transition-colors">
                <td className="px-4 py-2">
                  <Link href={`/spelare/${row.slug}`} className="text-foreground hover:text-pitch">
                    {row.fullname}
                  </Link>
                </td>
                <td className="text-center px-3 py-2 text-muted-foreground capitalize">{row.position?.slice(0, 3) ?? "-"}</td>
                {COLUMNS.map((column) => {
                  const value = row[column.key];
                  return (
                    <td key={column.key} className="text-center px-3 py-2 text-muted-foreground tabular-nums">
                      {column.key === "rating" ? (typeof value === "number" ? value.toFixed(2) : "-") : String(value ?? 0)}
                    </td>
                  );
                })}
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td colSpan={13} className="px-4 py-10 text-center text-sm text-muted-foreground">
                  Inga spelare matchar filtret.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
