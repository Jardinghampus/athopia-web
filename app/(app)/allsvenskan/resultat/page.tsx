import type { Metadata } from "next";
import Link from "next/link";
import { fetchAllsvenskanFixtures } from "@/lib/db/fixtures";
import type { SMFixture } from "@/lib/db/fixtures";
import { AppBreadcrumbs } from "@/components/ui/AppBreadcrumbs";

export const revalidate = 60;

export const metadata: Metadata = {
  title: "Allsvenskan Resultat 2026 – Alla Matchresultat",
  description: "Samtliga matchresultat från Allsvenskan 2026, omgång för omgång. Live-uppdaterat.",
  alternates: { canonical: "https://athopia.se/allsvenskan/resultat" },
  openGraph: {
    type: "website",
    locale: "sv_SE",
    url: "https://athopia.se/allsvenskan/resultat",
    title: "Allsvenskan Resultat 2026 – Alla Matchresultat",
    description: "Samtliga matchresultat från Allsvenskan 2026.",
  },
};

function getScore(f: SMFixture): { home: number; away: number } | null {
  const home = f.scores?.find(s => s.score.participant === "home")?.score.goals;
  const away = f.scores?.find(s => s.score.participant === "away")?.score.goals;
  if (home == null || away == null) return null;
  return { home, away };
}

function getParticipantName(f: SMFixture, location: "home" | "away"): string {
  const p = f.participants?.find(
    (p) => (p as unknown as Record<string, unknown>).location === location
  );
  return (p as unknown as Record<string, unknown>)?.name as string ?? "—";
}

export default async function AllsvenskanResultatPage() {
  const fixtures = await fetchAllsvenskanFixtures().catch(() => [] as SMFixture[]);
  const finished = fixtures
    .filter(f => f.state?.short_name === "FT" || f.state?.state === "finished")
    .sort((a, b) => new Date(b.starting_at).getTime() - new Date(a.starting_at).getTime());

  return (
    <div className="w-full px-4 sm:px-8 py-10 max-w-3xl mx-auto">
      <div className="mb-4">
        <AppBreadcrumbs
          items={[
            { label: "Allsvenskan", href: "/allsvenskan" },
            { label: "Resultat" },
          ]}
        />
      </div>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Allsvenskan", item: "https://athopia.se/allsvenskan" },
          { "@type": "ListItem", position: 2, name: "Resultat", item: "https://athopia.se/allsvenskan/resultat" },
        ],
      })}} />

      <nav className="text-xs text-muted-foreground mb-6 flex gap-2">
        <Link href="/allsvenskan" className="hover:text-foreground">Allsvenskan</Link>
        <span>›</span>
        <span className="text-foreground">Resultat</span>
      </nav>

      <h1 className="font-bold text-4xl sm:text-5xl text-foreground mb-2">ALLSVENSKAN RESULTAT 2026</h1>
      <p className="text-muted-foreground mb-8">Alla matchresultat — senaste matchen visas först.</p>

      {finished.length === 0 ? (
        <p className="text-muted-foreground">Inga spelade matcher ännu.</p>
      ) : (
        <div className="space-y-2">
          {finished.map(f => {
            const score = getScore(f);
            const home = getParticipantName(f, "home");
            const away = getParticipantName(f, "away");
            return (
              <Link
                key={f.id}
                href={`/match/${f.id}`}
                className="flex items-center justify-between rounded-xl border border-border bg-card p-4 hover:border-pitch/50 transition-colors"
              >
                <span className="font-medium w-[38%] text-right truncate">{home}</span>
                <span className="mx-4 font-bold text-lg tabular-nums shrink-0">
                  {score ? `${score.home}–${score.away}` : "—"}
                </span>
                <span className="font-medium w-[38%] truncate">{away}</span>
                <span className="text-xs text-muted-foreground ml-4 shrink-0 hidden sm:block">
                  {new Date(f.starting_at).toLocaleDateString("sv-SE", { day: "numeric", month: "short" })}
                </span>
              </Link>
            );
          })}
        </div>
      )}

      <div className="mt-6 flex gap-4 text-sm">
        <Link href="/allsvenskan/tabell" className="text-pitch hover:underline">Tabell →</Link>
        <Link href="/allsvenskan/spelschema" className="text-pitch hover:underline">Spelschema →</Link>
      </div>
    </div>
  );
}
