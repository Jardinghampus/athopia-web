import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { getTopScorersFromDb, SEASON_IDS } from "@/lib/statistik";
import { AppBreadcrumbs } from "@/components/ui/AppBreadcrumbs";

export const revalidate = 300;

export const metadata: Metadata = {
  title: "Allsvenskan Skytteliga 2026 – Toppskytt & Målkung",
  description: "Aktuell skytteliga för Allsvenskan 2026. Se vilken spelare som leder jakten på titeln som toppskytt med flest mål.",
  alternates: { canonical: "https://athopia.se/allsvenskan/skytteliga" },
  openGraph: {
    type: "website",
    locale: "sv_SE",
    url: "https://athopia.se/allsvenskan/skytteliga",
    title: "Allsvenskan Skytteliga 2026 – Toppskytt & Målkung",
    description: "Vem leder skytteligan i Allsvenskan 2026?",
  },
};

export default async function AllsvenskanSkytteligaPage() {
  // OBS: Object.values(SEASON_IDS)[0] ger "2025" pga JS:s heltalsnyckel-
  // sortering (numeriska nyckelsträngar ordnas alltid stigande, oavsett
  // insättningsordning) — gav en tom skytteliga i produktion 2026-07-03.
  // Explicit nyckel = korrekt oavsett hur SEASON_IDS-objektet är skrivet.
  const seasonId = SEASON_IDS["2026"] ?? "";
  const scorers = await getTopScorersFromDb(seasonId).catch(() => []);

  return (
    <div className="w-full px-4 sm:px-8 py-10 max-w-3xl mx-auto">
      <div className="mb-6">
        <AppBreadcrumbs
          items={[
            { label: "Allsvenskan", href: "/allsvenskan" },
            { label: "Skytteliga" },
          ]}
        />
      </div>

      <h1 className="font-bold text-4xl sm:text-5xl text-foreground mb-2">ALLSVENSKAN SKYTTELIGA 2026</h1>
      <p className="text-muted-foreground mb-8">Vem leder skytteligan just nu?</p>

      <div className="rounded-2xl border border-border overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/30 text-muted-foreground">
              <th className="text-left py-3 px-4 font-medium w-8">#</th>
              <th className="text-left py-3 px-4 font-medium">Spelare</th>
              <th className="text-left py-3 px-4 font-medium hidden sm:table-cell">Lag</th>
              <th className="text-center py-3 px-4 font-medium font-bold">Mål</th>
            </tr>
          </thead>
          <tbody>
            {scorers.slice(0, 20).map((s, i) => (
              <tr key={s.player_id ?? i} className="border-b border-border/50 hover:bg-muted/20 transition-colors">
                <td className="py-3 px-4 text-muted-foreground">{i + 1}</td>
                <td className="py-3 px-4">
                  <Link href={`/spelare/${s.slug ?? s.player_id}`} className="flex items-center gap-3 hover:text-pitch transition-colors">
                    {s.image && (
                      <div className="relative w-8 h-8 rounded-full overflow-hidden bg-muted shrink-0">
                        <Image src={s.image} alt={s.player_name ?? ""} fill className="object-cover" sizes="32px" />
                      </div>
                    )}
                    <span className="font-medium">{s.player_name}</span>
                  </Link>
                </td>
                <td className="py-3 px-4 text-muted-foreground hidden sm:table-cell">
                  <Link href={`/lag/${s.team_slug ?? s.team_name.toLowerCase().replace(/\s+/g, "-").replace(/[åä]/g, "a").replace(/ö/g, "o")}`} className="hover:text-pitch transition-colors">
                    {s.team_name}
                  </Link>
                </td>
                <td className="py-3 px-4 text-center font-bold text-foreground">{s.goals}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-6 flex gap-4 text-sm">
        <Link href="/allsvenskan/tabell" className="text-pitch hover:underline">Tabell →</Link>
        <Link href="/statistik" className="text-pitch hover:underline">All statistik →</Link>
      </div>
    </div>
  );
}
