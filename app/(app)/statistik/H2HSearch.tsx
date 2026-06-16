"use client";

import { useState } from "react";

const ALLSVENSKAN_TEAMS = [
  "AIK",
  "BK Häcken",
  "Djurgårdens IF",
  "GAIS",
  "IFK Göteborg",
  "Hammarby IF",
  "Helsingborgs IF",
  "IF Elfsborg",
  "IFK Norrköping",
  "Kalmar FF",
  "Malmö FF",
  "Mjällby AIF",
  "IK Sirius",
  "IFK Värnamo",
  "Örebro SK",
  "Östersunds FK",
];

export interface H2HFixture {
  id: number;
  date: string;
  home_team: string;
  away_team: string;
  home_goals: number | null;
  away_goals: number | null;
  name: string;
  state: string;
}

interface Props {
  fixtures: H2HFixture[];
}

function norm(s: string) {
  return s.toLowerCase().replace(/[\s\-_.]/g, "");
}

function teamsMatch(fixtureName: string, query: string): boolean {
  return norm(fixtureName).includes(norm(query.substring(0, 5)));
}

export function H2HSearch({ fixtures }: Props) {
  const [teamA, setTeamA] = useState("");
  const [teamB, setTeamB] = useState("");

  const filtered =
    teamA && teamB
      ? fixtures.filter(
          (f) =>
            (teamsMatch(f.home_team, teamA) && teamsMatch(f.away_team, teamB)) ||
            (teamsMatch(f.home_team, teamB) && teamsMatch(f.away_team, teamA))
        )
      : [];

  let aWins = 0;
  let bWins = 0;
  let draws = 0;
  for (const f of filtered) {
    if (f.home_goals === null || f.away_goals === null) continue;
    const aIsHome = teamsMatch(f.home_team, teamA);
    const aGoals = aIsHome ? f.home_goals : f.away_goals;
    const bGoals = aIsHome ? f.away_goals : f.home_goals;
    if (aGoals > bGoals) aWins++;
    else if (bGoals > aGoals) bWins++;
    else draws++;
  }

  return (
    <div className="space-y-6">
      {/* Lagval */}
      <div className="flex flex-col sm:flex-row gap-4 items-end">
        <div className="flex-1 space-y-1.5">
          <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Lag A
          </label>
          <select
            value={teamA}
            onChange={(e) => setTeamA(e.target.value)}
            className="w-full text-sm bg-card border border-border rounded-xl px-3 py-2.5 text-foreground focus:outline-none focus:ring-1 focus:ring-pitch/40 cursor-pointer"
          >
            <option value="">Välj lag...</option>
            {ALLSVENSKAN_TEAMS.filter((t) => t !== teamB).map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        </div>
        <div className="text-muted-foreground font-medium text-sm pb-2.5 hidden sm:block">vs</div>
        <div className="flex-1 space-y-1.5">
          <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Lag B
          </label>
          <select
            value={teamB}
            onChange={(e) => setTeamB(e.target.value)}
            className="w-full text-sm bg-card border border-border rounded-xl px-3 py-2.5 text-foreground focus:outline-none focus:ring-1 focus:ring-pitch/40 cursor-pointer"
          >
            <option value="">Välj lag...</option>
            {ALLSVENSKAN_TEAMS.filter((t) => t !== teamA).map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Resultat */}
      {!teamA || !teamB ? (
        <p className="text-center py-16 text-sm text-muted-foreground">
          Välj två lag ovan för att se historiska möten.
        </p>
      ) : fixtures.length === 0 ? (
        <p className="text-center py-16 text-sm text-muted-foreground">
          Data ej tillgänglig — matchdata synkroniseras via athopia-os.
        </p>
      ) : filtered.length === 0 ? (
        <p className="text-center py-16 text-sm text-muted-foreground">
          Inga möten hittades för vald säsong.
        </p>
      ) : (
        <>
          {/* Sammanfattning */}
          <div className="grid grid-cols-3 gap-3 text-center">
            {[
              { label: teamA, value: aWins },
              { label: "Oavgjort", value: draws },
              { label: teamB, value: bWins },
            ].map((stat) => (
              <div key={stat.label} className="bg-card border border-border rounded-xl p-4">
                <p className="text-3xl font-bold text-pitch">{stat.value}</p>
                <p className="text-xs text-muted-foreground mt-1 truncate">{stat.label}</p>
              </div>
            ))}
          </div>

          {/* Matcher */}
          <div className="space-y-2">
            {filtered.map((f) => (
              <div
                key={f.id}
                className="flex items-center gap-2 bg-card border border-border rounded-xl px-4 py-3 text-sm"
              >
                <span className="text-muted-foreground w-16 shrink-0 text-xs">
                  {new Date(f.date).toLocaleDateString("sv-SE", {
                    month: "short",
                    day: "numeric",
                  })}
                </span>
                <span className="flex-1 text-right text-foreground truncate">{f.home_team}</span>
                <span className="mx-3 font-mono font-bold text-foreground shrink-0 w-10 text-center">
                  {f.home_goals !== null ? `${f.home_goals}–${f.away_goals}` : "vs"}
                </span>
                <span className="flex-1 text-foreground truncate">{f.away_team}</span>
                <span className="text-muted-foreground w-16 text-right text-xs shrink-0 hidden sm:block">
                  {f.name}
                </span>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
