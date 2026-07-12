import type { Metadata } from "next";
import Link from "next/link";
import { ArticleCard } from "@/components/ui/ArticleCard";
import { ScoreWidget } from "@/components/ui/ScoreWidget";
import { Separator } from "@/components/ui/separator";
import { getNarratives, getFilteredArticles } from "@/lib/supabase";
import { fetchAllsvenskanFixtures, fetchStandingsFull } from "@/lib/db/fixtures";
import { FixturesTicker } from "@/components/ui/FixturesTicker";

export const revalidate = 60;

export const metadata: Metadata = {
  title: "Allsvenskan 2026 – Nyheter, Tabell, Resultat & Matcher",
  description: "Allsvenskan just nu: dagens nyheter, live-tabell, matchresultat och spelschema. Uppdateras löpande.",
  alternates: { canonical: "https://athopia.se/allsvenskan" },
  openGraph: {
    type: "website",
    locale: "sv_SE",
    url: "https://athopia.se/allsvenskan",
    title: "Allsvenskan 2026 – Nyheter, Tabell, Resultat & Matcher",
    description: "Allsvenskan just nu: dagens nyheter, live-tabell, matchresultat och spelschema.",
  },
};

const NEWS_PREVIEW_LIMIT = 6;
const STANDINGS_PREVIEW_ROWS = 8;
const FIXTURES_PREVIEW_LIMIT = 5;

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
  const [narratives, { articles }, standings, fixtures] = await Promise.all([
    getNarratives(1).catch(() => []),
    getFilteredArticles({ visa: "all", limit: NEWS_PREVIEW_LIMIT }).catch(() => ({ articles: [], total: 0 })),
    fetchStandingsFull().catch(() => []),
    fetchAllsvenskanFixtures().catch(() => []),
  ]);

  const topStory = narratives[0] ?? null;

  return (
    <div className="w-full px-6 sm:px-8 py-10">
      <AllsvenskanJsonLd />
      <div className="-mx-6 sm:-mx-8 -mt-10 mb-6">
        <FixturesTicker />
      </div>
      <div className="mb-8">
        <h1 className="font-bold text-5xl text-foreground">ALLSVENSKAN</h1>
        <p className="text-muted-foreground mt-2">Nyheter, tabell och matcher — uppdateras löpande.</p>
        <div className="flex gap-4 flex-wrap mt-3">
          <Link href="/allsvenskan/tabell" className="text-sm text-pitch hover:underline">Tabell</Link>
          <Link href="/allsvenskan/spelschema" className="text-sm text-pitch hover:underline">Spelschema</Link>
          <Link href="/allsvenskan/skytteliga" className="text-sm text-pitch hover:underline">Skytteliga</Link>
          <Link href="/allsvenskan/resultat" className="text-sm text-pitch hover:underline">Resultat</Link>
          <Link href="/statistik" className="text-sm text-pitch hover:underline">Statistik</Link>
        </div>
      </div>

      {topStory && (
        <Link
          href={`/narrativ/${topStory.id}`}
          className="mb-8 block rounded-2xl border border-border bg-card p-6 transition-colors hover:border-pitch/40"
        >
          <span className="text-xs font-medium uppercase tracking-wider text-pitch">Dagens story</span>
          <h2 className="mt-2 font-bold text-2xl text-foreground">{topStory.topic}</h2>
          {topStory.description && (
            <p className="mt-2 text-muted-foreground line-clamp-2">{topStory.description}</p>
          )}
          <span className="mt-3 inline-block text-sm text-muted-foreground">
            {topStory.sourceCount} källor
          </span>
        </Link>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-8">
        <section>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-semibold text-2xl text-foreground">NYHETER</h2>
            <Link href="/nyheter" className="text-sm text-pitch hover:underline">
              Alla nyheter →
            </Link>
          </div>
          {articles.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {articles.map((a, i) => (
                <ArticleCard key={a.id} article={a} size="md" priority={i === 0} />
              ))}
            </div>
          ) : (
            <div className="rounded-xl border border-border bg-card p-4 text-sm text-muted-foreground">
              Inga nyheter tillgängliga just nu.
            </div>
          )}
        </section>

        <aside className="flex flex-col gap-8">
          <div>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-semibold text-2xl text-foreground">TABELL</h2>
              <Link href="/allsvenskan/tabell" className="text-sm text-pitch hover:underline">
                Hela tabellen →
              </Link>
            </div>
            <div className="rounded-2xl border border-border bg-card overflow-hidden">
              <table className="w-full text-sm">
                <tbody>
                  {standings.slice(0, STANDINGS_PREVIEW_ROWS).map((row) => (
                    <tr key={row.team.id} className="border-b border-border/50 last:border-0">
                      <td className="p-3 text-muted-foreground tabular-nums w-8">{row.position}</td>
                      <td className="p-3 text-foreground">
                        <Link
                          href={`/lag/${row.team.slug ?? ""}`}
                          className="hover:text-pitch-light"
                        >
                          {row.team.name}
                        </Link>
                      </td>
                      <td className="p-3 text-right tabular-nums text-muted-foreground w-12">{row.goal_diff > 0 ? `+${row.goal_diff}` : row.goal_diff}</td>
                      <td className="p-3 text-right tabular-nums font-medium text-foreground w-10">{row.points}</td>
                    </tr>
                  ))}
                  {standings.length === 0 && (
                    <tr>
                      <td className="p-4 text-center text-muted-foreground">
                        Ingen tabell tillgänglig ännu.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div>
            <h2 className="mb-4 font-semibold text-2xl text-foreground">MATCHER</h2>
            <div className="flex flex-col gap-3">
              {fixtures.slice(0, FIXTURES_PREVIEW_LIMIT).map((f) => (
                <ScoreWidget key={f.id} fixture={f} />
              ))}
              {fixtures.length === 0 && (
                <div className="rounded-xl border border-border bg-card p-4 text-sm text-muted-foreground">
                  Inga matcher hittades just nu.
                </div>
              )}
            </div>
            <Separator className="my-4" />
            <Link href="/match" className="text-sm text-pitch hover:underline">
              Alla matcher →
            </Link>
          </div>
        </aside>
      </div>
    </div>
  );
}
