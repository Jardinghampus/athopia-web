import type { Metadata } from "next";
import Link from "next/link";
import { fetchAllsvenskanFixtures, fetchLiveScores } from "@/lib/db/fixtures";
import type { SMFixture } from "@/lib/db/fixtures";
import { ScoreWidget } from "@/components/ui/ScoreWidget";

export const metadata: Metadata = {
  title: "Allsvenskan-matcher 2026 – Schema & Resultat",
  description: "Allsvenskan matchschema, resultat och livescore för hela 2026-säsongen.",
};

export const revalidate = 60;

function FixtureList({ fixtures }: { fixtures: SMFixture[] }) {
  return (
    <div className="flex flex-col gap-2">
      {fixtures.map((fixture) => (
        <Link key={fixture.id} href={`/match/${fixture.id}`}>
          <ScoreWidget fixture={fixture} />
        </Link>
      ))}
    </div>
  );
}

export default async function MatcherPage() {
  const [live, all] = await Promise.all([
    fetchLiveScores().catch(() => [] as SMFixture[]),
    fetchAllsvenskanFixtures().catch(() => [] as SMFixture[]),
  ]);

  const now = Date.now();
  const upcoming = all
    .filter((f) => new Date(f.starting_at).getTime() >= now)
    .slice(0, 16);
  const recent = all
    .filter((f) => new Date(f.starting_at).getTime() < now)
    .sort((a, b) => new Date(b.starting_at).getTime() - new Date(a.starting_at).getTime())
    .slice(0, 16);

  const nothingAtAll = live.length === 0 && upcoming.length === 0 && recent.length === 0;

  return (
    <div className="w-full px-6 sm:px-8 py-8">
      <h1 className="font-bold text-3xl text-foreground mb-6">Matcher</h1>

      {nothingAtAll && (
        <div className="rounded-2xl border border-border bg-card p-8 text-center text-muted-foreground">
          <p>Inga matcher att visa just nu.</p>
          <p className="text-sm mt-2">Matchdata synkroniseras — kom tillbaka om en stund.</p>
        </div>
      )}

      {live.length > 0 && (
        <section className="mb-8">
          <h2 className="font-semibold text-xl text-foreground mb-3 flex items-center gap-2">
            <span className="inline-block w-2 h-2 rounded-full bg-red-500 animate-pulse" />
            Live nu
          </h2>
          <FixtureList fixtures={live} />
        </section>
      )}

      {upcoming.length > 0 ? (
        <section className="mb-8">
          <h2 className="font-semibold text-xl text-foreground mb-3">Kommande</h2>
          <FixtureList fixtures={upcoming} />
        </section>
      ) : (
        !nothingAtAll &&
        live.length === 0 && (
          <div className="mb-8 rounded-2xl border border-border bg-card p-6 text-center text-muted-foreground">
            <p className="font-medium text-foreground">Allsvenskan har uppehåll.</p>
            <p className="text-sm mt-1">Spelschemat fylls på när nästa omgång är fastställd — senaste resultaten nedan.</p>
          </div>
        )
      )}

      {recent.length > 0 && (
        <section>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-semibold text-xl text-foreground">Senaste resultat</h2>
            <Link href="/allsvenskan/resultat" className="text-sm text-pitch hover:underline">
              Alla resultat →
            </Link>
          </div>
          <FixtureList fixtures={recent} />
        </section>
      )}
    </div>
  );
}
