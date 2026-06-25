import type { Metadata } from "next";
import Link from "next/link";
import { fetchAllsvenskanFixtures, fetchStandings } from "@/lib/db/fixtures";
import { ScoreWidget } from "@/components/ui/ScoreWidget";
import { Separator } from "@/components/ui/separator";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Allsvenskan 2026 – Tabell, Resultat & Matcher",
  description: "Live-tabell, matchresultat, spelschema och statistik för Allsvenskan 2026. Uppdateras löpande.",
  alternates: { canonical: "https://athopia.se/allsvenskan" },
  openGraph: {
    type: "website",
    locale: "sv_SE",
    url: "https://athopia.se/allsvenskan",
    title: "Allsvenskan 2026 – Tabell, Resultat & Matcher",
    description: "Live-tabell, matchresultat, spelschema och statistik för Allsvenskan 2026.",
  },
};

function AllsvenskanJsonLd() {
  return (
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
      "@context": "https://schema.org",
      "@type": "SportsOrganization",
      "@id": "https://athopia.se/allsvenskan#allsvenskan",
      name: "Allsvenskan",
      sport: "Soccer",
      url: "https://athopia.se/allsvenskan",
      description: "Allsvenskan är den högsta divisionen i svensk klubbfotboll för herrar.",
    })}} />
  );
}

export default async function AllsvenskanPage() {
  const [standings, fixtures] = await Promise.all([
    fetchStandings().catch(() => []),
    fetchAllsvenskanFixtures().catch(() => []),
  ]);

  return (
    <div className="w-full px-6 sm:px-8 py-10">
      <AllsvenskanJsonLd />
      <div className="flex items-end justify-between gap-6 mb-8">
        <div>
          <h1 className="font-bold text-5xl text-foreground">ALLSVENSKAN</h1>
          <p className="text-muted-foreground mt-2">Tabell och matchschema — uppdateras löpande.</p>
          <div className="flex gap-4 flex-wrap mt-3">
            <Link href="/allsvenskan/tabell" className="text-sm text-pitch hover:underline">Tabell</Link>
            <Link href="/allsvenskan/spelschema" className="text-sm text-pitch hover:underline">Spelschema</Link>
            <Link href="/allsvenskan/skytteliga" className="text-sm text-pitch hover:underline">Skytteliga</Link>
            <Link href="/allsvenskan/resultat" className="text-sm text-pitch hover:underline">Resultat</Link>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-8">
        <section className="rounded-2xl border border-border bg-card overflow-hidden">
          <div className="p-5">
            <h2 className="font-semibold text-2xl text-foreground">TABELL</h2>
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
                      Ingen tabell-data tillgänglig ännu.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>

        <aside>
          <h2 className="font-semibold text-2xl text-foreground mb-4">MATCHER</h2>
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

