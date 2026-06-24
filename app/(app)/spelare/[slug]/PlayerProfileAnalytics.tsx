"use client";

import { motion } from "motion/react";
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
    baseline: 50,
  }));
  const barData = metrics.slice(0, 6).map((metric) => ({
    metric: metric.label,
    spelare: metric.value,
    snitt: metric.average,
  }));

  const fmt = (value: number, decimals = 2) =>
    Number.isFinite(value) ? value.toLocaleString("sv-SE", { maximumFractionDigits: decimals, minimumFractionDigits: decimals }) : "-";

  return (
    <motion.section
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.42, ease: [0.22, 1, 0.36, 1] }}
      className="space-y-4"
    >
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.04, duration: 0.36, ease: [0.22, 1, 0.36, 1] }}
      >
        <h2 className="font-semibold text-xl text-foreground">PROFILKORT</h2>
        <p className="text-sm text-muted-foreground">
          Jämförd mot snittet för allsvenska spelare med minst {qualifyingMinutes} minuter. {minutes >= qualifyingMinutes ? "Kvalificerad sample." : "Under kvalgränsen, tolka percentiler försiktigt."}
        </p>
      </motion.div>

      <div className="grid gap-4 lg:grid-cols-[0.9fr_1.1fr]">
        <motion.div
          whileHover={{ y: -2 }}
          transition={{ duration: 0.2 }}
          className="rounded-2xl border border-border bg-card p-4 shadow-sm"
        >
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
              <PolarAngleAxis dataKey="metric" tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} />
              <Tooltip
                formatter={(value) => [`${value}`, "Percentil"]}
                contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }}
              />
              <Radar dataKey="baseline" name="Allsvenskan baseline" stroke="#f59e0b" fill="#f59e0b" fillOpacity={0.08} strokeWidth={1.5} strokeDasharray="4 4" />
              <Radar dataKey="percentile" name={playerName} stroke="var(--color-pitch)" fill="var(--color-pitch)" fillOpacity={0.24} strokeWidth={2} />
            </RadarChart>
          </ResponsiveContainer>
          <p className="text-center text-[11px] text-muted-foreground">
            <span className="text-amber-500">Gul linje</span> = Allsvenskan baseline (P50). Grönt = spelarens profil.
          </p>
        </motion.div>

        <motion.div
          whileHover={{ y: -2 }}
          transition={{ duration: 0.2 }}
          className="rounded-2xl border border-border bg-card p-4 shadow-sm"
        >
          <p className="mb-3 text-xs uppercase tracking-wider text-muted-foreground">Per 90 mot snittspelaren</p>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={barData} margin={{ top: 8, right: 12, bottom: 8, left: 0 }}>
              <CartesianGrid vertical={false} stroke="hsl(var(--border))" opacity={0.55} />
              <XAxis dataKey="metric" tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} />
              <YAxis tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} width={34} />
              <Tooltip
                contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }}
              />
              <Bar dataKey="snitt" name="Snitt" fill="hsl(var(--muted))" radius={[4, 4, 0, 0]} />
              <Bar dataKey="spelare" name={playerName} fill="var(--color-pitch)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </motion.div>
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {metrics.map((metric, index) => (
          <motion.div
            key={metric.key}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.06 + index * 0.035, duration: 0.34, ease: [0.22, 1, 0.36, 1] }}
            whileHover={{ y: -2 }}
            className="rounded-2xl border border-border bg-card p-4 shadow-sm"
          >
            <p className="text-xs text-muted-foreground">{metric.label}</p>
            <p className="mt-1 text-2xl font-bold tabular-nums text-foreground">
              {fmt(metric.value, metric.decimals ?? 2)}{metric.suffix ?? ""}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              Snitt {fmt(metric.average, metric.decimals ?? 2)} · P{metric.percentile}
            </p>
          </motion.div>
        ))}
      </div>
    </motion.section>
  );
}

