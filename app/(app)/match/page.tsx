import type { Metadata } from "next";
import Link from "next/link";
import { createServerClient, isSupabaseConfigured } from "@/lib/supabase";
import { fetchAllsvenskanFixtures } from "@/lib/db/fixtures";
import type { SMFixture } from "@/lib/db/fixtures";
import { ScoreWidget } from "@/components/ui/ScoreWidget";

export const metadata: Metadata = {
  title: "Matcher | Athopia",
  description: "Allsvenskan matchschema, resultat och livescore.",
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
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
      <h1 className="font-heading text-4xl text-foreground mb-6">MATCHER</h1>

      {fixtures.length === 0 ? (
        <div className="rounded-2xl border border-border bg-card p-8 text-center text-muted-foreground">
          <p>Inga matcher att visa just nu.</p>
          <p className="text-sm mt-2">Data synkroniseras från Supabase via athopia-os.</p>
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
