"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";

interface XgDataPoint {
  match: string; // "AIK - H" format
  teamA: number;
  teamB: number;
}

interface XgChartProps {
  data: XgDataPoint[];
  nameA: string;
  nameB: string;
  colorA?: string;
  colorB?: string;
}

export function XgChart({ data, nameA, nameB, colorA = "var(--color-pitch)", colorB = "#3B82F6" }: XgChartProps) {
  if (data.length === 0) {
    return (
      <div className="h-48 flex items-center justify-center text-muted-foreground text-sm">
        Ingen xG-data tillgänglig ännu.
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={220}>
      <LineChart data={data} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
        <XAxis
          dataKey="match"
          tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
          tickLine={false}
          axisLine={false}
        />
        <YAxis
          tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
          tickLine={false}
          axisLine={false}
          width={28}
        />
        <Tooltip
          contentStyle={{
            background: "hsl(var(--card))",
            border: "1px solid hsl(var(--border))",
            borderRadius: 8,
            fontSize: 12,
          }}
          labelStyle={{ color: "hsl(var(--foreground))", fontWeight: 600 }}
        />
        <Legend
          wrapperStyle={{ fontSize: 12, paddingTop: 8 }}
          formatter={(value) => <span style={{ color: "hsl(var(--foreground))" }}>{value}</span>}
        />
        <ReferenceLine y={1.5} stroke="hsl(var(--border))" strokeDasharray="3 3" />
        <Line
          type="monotone"
          dataKey="teamA"
          name={nameA}
          stroke={colorA}
          strokeWidth={2}
          dot={{ r: 3, fill: colorA }}
          activeDot={{ r: 5 }}
        />
        <Line
          type="monotone"
          dataKey="teamB"
          name={nameB}
          stroke={colorB}
          strokeWidth={2}
          dot={{ r: 3, fill: colorB }}
          activeDot={{ r: 5 }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
