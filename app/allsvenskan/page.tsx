import type { Metadata } from "next";
import Link from "next/link";
import { fetchAllsvenskanFixtures, fetchStandings } from "@/lib/sportsmonks";
import { ScoreWidget } from "@/components/ui/ScoreWidget";
import { Separator } from "@/components/ui/separator";

export const revalidate = 60;

export const metadata: Metadata = {
  title: "Allsvenskan",
  description: "Tabell, matcher och live scores för Allsvenskan på Athopia.",
};

export default async function AllsvenskanPage() {
  const [standings, fixtures] = await Promise.all([fetchStandings(), fetchAllsvenskanFixtures()]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10">
      <div className="flex items-end justify-between gap-6 mb-8">
        <div>
          <h1 className="font-heading text-5xl text-foreground">ALLSVENSKAN</h1>
          <p className="text-muted-foreground mt-2">Tabell och matchschema — uppdateras löpande.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-8">
        <section className="rounded-2xl border border-border bg-card overflow-hidden">
          <div className="p-5">
            <h2 className="font-heading text-2xl text-foreground">TABELL</h2>
          </div>
          <Separator />
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-muted-foreground">
                <tr className="border-b border-border">
                  <th className="text-left font-medium p-3 w-10">#</th>
                  <th className="text-left font-medium p-3">Lag</th>
                  <th className="text-right font-medium p-3 w-12">M</th>
                  <th className="text-right font-medium p-3 w-16">+/-</th>
                  <th className="text-right font-medium p-3 w-14">P</th>
                  <th className="text-right font-medium p-3 w-36">Form</th>
                </tr>
              </thead>
              <tbody>
                {standings.map((row) => {
                  const gd = row.goals_for - row.goals_against;
                  return (
                    <tr key={row.team.id} className="border-b border-border/50">
                      <td className="p-3 text-muted-foreground tabular-nums">{row.position ?? "-"}</td>
                      <td className="p-3">
                        <Link href={`/lag/${row.team.name.toLowerCase().replace(/\s+/g, "-")}`} className="hover:text-pitch-light">
                          {row.team.name}
                        </Link>
                      </td>
                      <td className="p-3 text-right tabular-nums text-muted-foreground">–</td>
                      <td className="p-3 text-right tabular-nums text-muted-foreground">{gd}</td>
                      <td className="p-3 text-right tabular-nums font-medium text-foreground">–</td>
                      <td className="p-3">
                        <div className="flex justify-end gap-1">
                          {(row.form ?? []).slice(-5).map((r, i) => (
                            <span
                              key={i}
                              className={`w-6 h-6 rounded-full text-[11px] font-bold grid place-items-center ${
                                r === "W"
                                  ? "bg-pitch/20 text-pitch-light"
                                  : r === "D"
                                  ? "bg-white/5 text-foreground/80"
                                  : "bg-red-500/15 text-red-300"
                              }`}
                            >
                              {r}
                            </span>
                          ))}
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {standings.length === 0 && (
                  <tr>
                    <td colSpan={6} className="p-6 text-center text-muted-foreground">
                      Ingen tabell-data (kräver `SPORTSMONKS_ALLSVENSKAN_SEASON_ID`).
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>

        <aside>
          <h2 className="font-heading text-2xl text-foreground mb-4">MATCHER</h2>
          <div className="flex flex-col gap-3">
            {fixtures.slice(0, 8).map((f) => (
              <ScoreWidget key={f.id} fixture={f} />
            ))}
            {fixtures.length === 0 && (
              <div className="rounded-xl border border-border bg-card p-4 text-sm text-muted-foreground">
                Inga matcher hittades just nu.
              </div>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}

