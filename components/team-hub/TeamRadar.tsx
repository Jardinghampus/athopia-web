"use client";

import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  ResponsiveContainer,
  Tooltip,
} from "recharts";

interface RadarPoint {
  metric: string;
  value: number; // 0–100, normaliserat mot ligan
  raw: number;
}

/**
 * Lagprofil-radar — normaliserade värden (z-score → 0–100) mot ligamedian.
 * 50 = ligasnitt, >50 = över snittet. Inga hårdkodade värden.
 */
export function TeamRadar({ data, color = "var(--color-pitch)" }: { data: RadarPoint[]; color?: string }) {
  if (data.length === 0) {
    return (
      <div className="h-[220px] flex items-center justify-center text-sm text-muted-foreground">
        Ingen profildata ännu.
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={240}>
      <RadarChart data={data} margin={{ top: 10, right: 30, bottom: 10, left: 30 }}>
        <PolarGrid stroke="hsl(var(--border))" />
        <PolarAngleAxis
          dataKey="metric"
          tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
        />
        <Tooltip
          contentStyle={{
            background: "hsl(var(--card))",
            border: "1px solid hsl(var(--border))",
            borderRadius: 8,
            fontSize: 12,
          }}
          formatter={(_v, _n, item) => {
            const pt = (item as { payload?: RadarPoint })?.payload;
            return [`${pt?.raw ?? "–"} (percentil ${pt?.value ?? 0})`, pt?.metric ?? ""];
          }}
        />
        <Radar
          dataKey="value"
          stroke={color}
          fill={color}
          fillOpacity={0.35}
          strokeWidth={2}
        />
      </RadarChart>
    </ResponsiveContainer>
  );
}
