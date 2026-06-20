"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  PolarAngleAxis,
  PolarGrid,
  Radar,
  RadarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

export interface ProfileMetric {
  key: string;
  label: string;
  value: number;
  average: number;
  percentile: number;
  decimals?: number;
  suffix?: string;
}

export function PlayerProfileAnalytics({
  playerName,
  minutes,
  qualifyingMinutes,
  metrics,
}: {
  playerName: string;
  minutes: number;
  qualifyingMinutes: number;
  metrics: ProfileMetric[];
}) {
  if (!metrics.length) return null;

  const radarData = metrics.map((metric) => ({
    metric: metric.label,
    percentile: metric.percentile,
  }));
  const barData = metrics.slice(0, 6).map((metric) => ({
    metric: metric.label,
    spelare: metric.value,
    snitt: metric.average,
  }));

  const fmt = (value: number, decimals = 2) =>
    Number.isFinite(value) ? value.toLocaleString("sv-SE", { maximumFractionDigits: decimals, minimumFractionDigits: decimals }) : "-";

  return (
    <section className="space-y-4">
      <div>
        <h2 className="font-semibold text-xl text-foreground">PROFILKORT</h2>
        <p className="text-sm text-muted-foreground">
          Jämförd mot allsvenska spelare med minst {qualifyingMinutes} minuter. {minutes >= qualifyingMinutes ? "Kvalificerad sample." : "Under kvalgränsen, tolka percentiler försiktigt."}
        </p>
      </div>

      <div className="grid gap-4 lg:grid-cols-[0.9fr_1.1fr]">
        <div className="rounded-2xl border border-border bg-card p-4">
          <div className="mb-3 flex items-center justify-between gap-3">
            <div>
              <p className="text-xs uppercase tracking-wider text-muted-foreground">Percentilprofil</p>
              <p className="text-sm font-medium text-foreground">{playerName}</p>
            </div>
            <div className="rounded-full border border-border px-3 py-1 text-xs text-muted-foreground">
              {minutes} min
            </div>
          </div>
          <ResponsiveContainer width="100%" height={270}>
            <RadarChart data={radarData} margin={{ top: 8, right: 28, bottom: 8, left: 28 }}>
              <PolarGrid stroke="hsl(var(--border))" />
              <PolarAngleAxis dataKey="metric" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
              <Tooltip
                formatter={(value) => [`${value}`, "Percentil"]}
                contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }}
              />
              <Radar dataKey="percentile" name="Percentil" stroke="var(--color-pitch)" fill="var(--color-pitch)" fillOpacity={0.24} strokeWidth={2} />
            </RadarChart>
          </ResponsiveContainer>
          <p className="text-center text-[11px] text-muted-foreground">50 = ligasnitt, 90+ = elitnivå i Allsvenskan.</p>
        </div>

        <div className="rounded-2xl border border-border bg-card p-4">
          <p className="mb-3 text-xs uppercase tracking-wider text-muted-foreground">Per 90 mot snittspelaren</p>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={barData} margin={{ top: 8, right: 12, bottom: 8, left: 0 }}>
              <CartesianGrid vertical={false} stroke="hsl(var(--border))" opacity={0.55} />
              <XAxis dataKey="metric" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
              <YAxis tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} width={34} />
              <Tooltip
                contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }}
              />
              <Bar dataKey="snitt" name="Snitt" fill="hsl(var(--muted))" radius={[4, 4, 0, 0]} />
              <Bar dataKey="spelare" name={playerName} fill="var(--color-pitch)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {metrics.map((metric) => (
          <div key={metric.key} className="rounded-2xl border border-border bg-card p-4">
            <p className="text-xs text-muted-foreground">{metric.label}</p>
            <p className="mt-1 text-2xl font-bold tabular-nums text-foreground">
              {fmt(metric.value, metric.decimals ?? 2)}{metric.suffix ?? ""}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              Snitt {fmt(metric.average, metric.decimals ?? 2)} · P{metric.percentile}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}
