"use client";

import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  ResponsiveContainer,
  Legend,
  Tooltip,
} from "recharts";

export interface PlayerRadarSeries {
  name: string;
  color: string;
  values: { metric: string; value: number; raw: number }[];
}

/**
 * Spelar-vs-spelar radar. Normaliserade percentilvärden (0–100) mot spelarpoolen.
 * Stödjer en eller två spelare överlagrade.
 */
export function PlayerRadar({ series }: { series: PlayerRadarSeries[] }) {
  if (series.length === 0 || series[0].values.length === 0) {
    return (
      <div className="h-[260px] flex items-center justify-center text-sm text-muted-foreground">
        Välj spelare för att se profilen.
      </div>
    );
  }

  // Sammanfoga till ett dataset per metric.
  const metrics = series[0].values.map((v) => v.metric);
  const data = metrics.map((metric, i) => {
    const row: Record<string, number | string> = { metric };
    series.forEach((s, si) => { row[`s${si}`] = s.values[i]?.value ?? 0; });
    return row;
  });

  return (
    <ResponsiveContainer width="100%" height={280}>
      <RadarChart data={data} margin={{ top: 12, right: 36, bottom: 12, left: 36 }}>
        <PolarGrid stroke="hsl(var(--border))" />
        <PolarAngleAxis dataKey="metric" tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} />
        <Tooltip
          contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }}
        />
        <Legend wrapperStyle={{ fontSize: 12 }} formatter={(v) => <span style={{ color: "hsl(var(--foreground))" }}>{v}</span>} />
        {series.map((s, si) => (
          <Radar key={si} name={s.name} dataKey={`s${si}`} stroke={s.color} fill={s.color} fillOpacity={0.25} strokeWidth={2} />
        ))}
      </RadarChart>
    </ResponsiveContainer>
  );
}

