import type { Metadata } from "next";
import Link from "next/link";
import { fetchStandingsFull } from "@/lib/db/fixtures";
import type { SMStandingRow } from "@/lib/db/fixtures";

export const revalidate = 60;

export const metadata: Metadata = {
  title: "Allsvenskan Tabell 2026 – Poängtabell & Ställning",
  description: "Aktuell Allsvenskan-tabell 2026 med poäng, målskillnad och form för alla 16 lag. Uppdateras automatiskt efter varje match.",
  alternates: { canonical: "https://athopia.se/allsvenskan/tabell" },
  openGraph: {
    type: "website",
    locale: "sv_SE",
    url: "https://athopia.se/allsvenskan/tabell",
    title: "Allsvenskan Tabell 2026 – Poängtabell & Ställning",
    description: "Aktuell Allsvenskan-tabell 2026 med poäng, målskillnad och form.",
  },
};

export default async function AllsvenskanTabellPage() {
  const standings = await fetchStandingsFull().catch(() => [] as SMStandingRow[]);

  return (
    <div className="w-full px-4 sm:px-8 py-10 max-w-3xl mx-auto">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
        "@context": "https://schema.org",
        "@type": "Table",
        about: { "@type": "SportsOrganization", name: "Allsvenskan 2026", sport: "Soccer", url: "https://athopia.se/allsvenskan" },
        description: standings[0] ? `Allsvenskan-tabell 2026. Ledare: ${standings[0].team.name}` : "Allsvenskan-tabell 2026",
      })}} />

      <nav className="text-xs text-muted-foreground mb-6 flex gap-2">
        <Link href="/allsvenskan" className="hover:text-foreground">Allsvenskan</Link>
        <span>›</span>
        <span className="text-foreground">Tabell</span>
      </nav>

      <h1 className="font-bold text-4xl sm:text-5xl text-foreground mb-2">ALLSVENSKAN TABELL 2026</h1>
      <p className="text-muted-foreground mb-8">Uppdateras löpande under säsongen.</p>

      <div className="rounded-2xl border border-border overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/30 text-muted-foreground">
              <th className="text-left py-3 px-4 font-medium w-8">#</th>
              <th className="text-left py-3 px-4 font-medium">Lag</th>
              <th className="text-center py-3 px-3 font-medium">M</th>
              <th className="text-center py-3 px-3 font-medium">V</th>
              <th className="text-center py-3 px-3 font-medium">O</th>
              <th className="text-center py-3 px-3 font-medium">F</th>
              <th className="text-center py-3 px-3 font-medium hidden sm:table-cell">Gjorda</th>
              <th className="text-center py-3 px-3 font-medium hidden sm:table-cell">Insläppta</th>
              <th className="text-center py-3 px-3 font-medium">+/-</th>
              <th className="text-center py-3 px-4 font-medium font-bold">P</th>
              <th className="text-center py-3 px-3 font-medium hidden md:table-cell">Form</th>
            </tr>
          </thead>
          <tbody>
            {standings.length === 0 && (
              <tr>
                <td colSpan={11} className="py-10 text-center text-muted-foreground">
                  Tabellen kunde inte hämtas just nu — uppdateras automatiskt inom en minut.
                </td>
              </tr>
            )}
            {standings.map((row) => (
              <tr key={row.team.name} className="border-b border-border/50 hover:bg-muted/20 transition-colors">
                <td className="py-3 px-4 text-muted-foreground">
                  <span className="inline-flex items-center gap-1">
                    {row.position}
                    {row.trend != null && row.trend !== 0 && (
                      <span
                        className={`text-[10px] leading-none ${row.trend > 0 ? "text-success" : "text-red-400"}`}
                        title={row.trend > 0 ? `Upp ${row.trend}` : `Ner ${Math.abs(row.trend)}`}
                        aria-label={row.trend > 0 ? `Klättrat ${row.trend} placeringar` : `Tappat ${Math.abs(row.trend)} placeringar`}
                      >
                        {row.trend > 0 ? "▲" : "▼"}
                      </span>
                    )}
                  </span>
                </td>
                <td className="py-3 px-4">
                  <Link href={`/lag/${row.team.slug ?? row.team.name.toLowerCase().replace(/\s+/g, "-").replace(/[åä]/g, "a").replace(/ö/g, "o")}`} className="font-medium hover:text-pitch transition-colors">
                    {row.team.name}
                  </Link>
                </td>
                <td className="py-3 px-3 text-center text-muted-foreground">{row.played}</td>
                <td className="py-3 px-3 text-center text-muted-foreground">{row.wins}</td>
                <td className="py-3 px-3 text-center text-muted-foreground">{row.draws}</td>
                <td className="py-3 px-3 text-center text-muted-foreground">{row.losses}</td>
                <td className="py-3 px-3 text-center text-muted-foreground hidden sm:table-cell">{row.goals_for}</td>
                <td className="py-3 px-3 text-center text-muted-foreground hidden sm:table-cell">{row.goals_against}</td>
                <td className="py-3 px-3 text-center text-muted-foreground">{row.goal_diff > 0 ? `+${row.goal_diff}` : row.goal_diff}</td>
                <td className="py-3 px-4 text-center font-bold text-foreground">{row.points}</td>
                <td className="py-3 px-3 text-center hidden md:table-cell">
                  <span className="flex gap-0.5 justify-center">
                    {row.form.map((r, fi) => (
                      <span key={fi} className={`w-4 h-4 rounded-sm text-[9px] font-bold flex items-center justify-center ${r === "W" ? "bg-success/20 text-success" : r === "L" ? "bg-red-400/20 text-red-400" : "bg-muted text-muted-foreground"}`}>{r === "W" ? "V" : r === "L" ? "F" : "O"}</span>
                    ))}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-6 flex gap-4 text-sm">
        <Link href="/allsvenskan/spelschema" className="text-pitch hover:underline">Spelschema →</Link>
        <Link href="/allsvenskan/skytteliga" className="text-pitch hover:underline">Skytteliga →</Link>
        <Link href="/allsvenskan/xp-tabell" className="text-pitch hover:underline">xP-tabellen →</Link>
      </div>
    </div>
  );
}
