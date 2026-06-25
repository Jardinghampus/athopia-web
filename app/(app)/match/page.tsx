import type { Metadata } from "next";
import Link from "next/link";
import { createServerClient, isSupabaseConfigured } from "@/lib/supabase";
import { fetchAllsvenskanFixtures } from "@/lib/db/fixtures";
import type { SMFixture } from "@/lib/db/fixtures";
import { ScoreWidget } from "@/components/ui/ScoreWidget";

export const metadata: Metadata = {
  title: "Allsvenskan-matcher 2026 – Schema & Resultat",
  description: "Allsvenskan matchschema, resultat och livescore för hela 2026-säsongen.",
};

export const revalidate = 60;

async function getFixtures(): Promise<SMFixture[]> {
  try {
    const fixtures = await fetchAllsvenskanFixtures();
    return fixtures.slice(0, 20);
  } catch {
    return [];
  }
}

export default async function MatcherPage() {
  const fixtures = await getFixtures();

  return (
    <div className="w-full px-6 sm:px-8 py-8">
      <h1 className="font-bold text-3xl text-foreground mb-6">Matcher</h1>

      {fixtures.length === 0 ? (
        <div className="rounded-2xl border border-border bg-card p-8 text-center text-muted-foreground">
          <p>Inga matcher att visa just nu.</p>
          <p className="text-sm mt-2">Matchdata synkroniseras — kom tillbaka om en stund.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {fixtures.map((fixture) => (
            <Link key={fixture.id} href={`/match/${fixture.id}`}>
              <ScoreWidget fixture={fixture} />
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
