"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  LabelList,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

/**
 * Mål vs xG per lag — finishing/regression-signalen. Bolldata visar bara råa xG;
 * vi visar utfallet mot förväntan (över-/underprestation).
 * Renderas bara när äkta xG finns (hasXg-guard i page.tsx). Aldrig påhittade nollor.
 */
export function MatchXgChart({
  homeName,
  awayName,
  homeGoals,
  awayGoals,
  homeXg,
  awayXg,
}: {
  homeName: string;
  awayName: string;
  homeGoals: number;
  awayGoals: number;
  homeXg: number;
  awayXg: number;
}) {
  const data = [
    { team: homeName, Mål: homeGoals, xG: +homeXg.toFixed(2), diff: homeGoals - homeXg },
    { team: awayName, Mål: awayGoals, xG: +awayXg.toFixed(2), diff: awayGoals - awayXg },
  ];

  const verdict = (diff: number) =>
    diff >= 0.75 ? "överpresterade" : diff <= -0.75 ? "underpresterade" : "matchade xG";

  return (
    <div className="bg-card border border-border rounded-xl p-4 space-y-3">
      <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
        Mål mot förväntan (xG)
      </h3>
      <ResponsiveContainer width="100%" height={200}>
        <BarChart data={data} margin={{ top: 16, right: 12, bottom: 0, left: -16 }}>
          <CartesianGrid vertical={false} stroke="hsl(var(--border))" opacity={0.55} />
          <XAxis dataKey="team" tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} />
          <YAxis tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} allowDecimals width={34} />
          <Tooltip
            contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }}
          />
          <Bar dataKey="xG" name="xG" fill="hsl(var(--muted))" radius={[4, 4, 0, 0]}>
            <LabelList dataKey="xG" position="top" style={{ fontSize: 11, fill: "var(--muted-foreground)" }} />
          </Bar>
          <Bar dataKey="Mål" name="Mål" fill="var(--color-pitch)" radius={[4, 4, 0, 0]}>
            <LabelList dataKey="Mål" position="top" style={{ fontSize: 11, fill: "var(--color-pitch)" }} />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
      <div className="grid grid-cols-2 gap-2 text-xs">
        {data.map((d) => (
          <p key={d.team} className="text-muted-foreground">
            <span className="font-semibold text-foreground">{d.team}</span> {verdict(d.diff)}{" "}
            <span className="tabular-nums">({d.diff >= 0 ? "+" : ""}{d.diff.toFixed(2)})</span>
          </p>
        ))}
      </div>
    </div>
  );
}
