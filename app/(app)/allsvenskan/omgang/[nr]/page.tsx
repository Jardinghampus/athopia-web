import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { fetchRoundFixtures } from "@/lib/db/fixtures";

export const revalidate = 300;

const TOTAL_ROUNDS = 30;

export function generateStaticParams() {
  return Array.from({ length: TOTAL_ROUNDS }, (_, i) => ({ nr: String(i + 1) }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ nr: string }>;
}): Promise<Metadata> {
  const { nr } = await params;
  return {
    title: `Allsvenskan Omgång ${nr} 2026 – Resultat & Spelschema`,
    description: `Alla matcher i Allsvenskan omgång ${nr} 2026: avsparkstider, resultat och matchdetaljer.`,
    alternates: { canonical: `https://athopia.se/allsvenskan/omgang/${nr}` },
    openGraph: {
      type: "website",
      locale: "sv_SE",
      url: `https://athopia.se/allsvenskan/omgang/${nr}`,
      title: `Allsvenskan Omgång ${nr} 2026`,
      description: `Alla matcher i Allsvenskan omgång ${nr} 2026.`,
    },
  };
}

export default async function OmgangPage({
  params,
}: {
  params: Promise<{ nr: string }>;
}) {
  const { nr } = await params;
  const round = Number(nr);
  if (!Number.isInteger(round) || round < 1 || round > TOTAL_ROUNDS) notFound();

  const fixtures = await fetchRoundFixtures(round);

  return (
    <div className="w-full px-4 sm:px-8 py-10 max-w-3xl mx-auto">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "SportsEvent",
            name: `Allsvenskan omgång ${round} 2026`,
            sport: "Soccer",
            subEvent: fixtures.map((f) => ({
              "@type": "SportsEvent",
              name: f.name,
              startDate: f.starting_at,
              url: `https://athopia.se/match/${f.id}`,
            })),
          }),
        }}
      />

      <nav className="text-xs text-muted-foreground mb-6 flex gap-2">
        <Link href="/allsvenskan" className="hover:text-foreground">Allsvenskan</Link>
        <span>›</span>
        <span className="text-foreground">Omgång {round}</span>
      </nav>

      <h1 className="font-bold text-4xl sm:text-5xl text-foreground mb-2">OMGÅNG {round}</h1>
      <p className="text-muted-foreground mb-8">Allsvenskan 2026 — {fixtures.length || 8} matcher.</p>

      {fixtures.length === 0 ? (
        <p className="rounded-2xl border border-border bg-card px-4 py-10 text-center text-muted-foreground">
          Matcherna för omgång {round} har inte publicerats ännu.
        </p>
      ) : (
        <ul className="rounded-2xl border border-border divide-y divide-border/50 overflow-hidden">
          {fixtures.map((f) => {
            const home = f.participants.find((p) => p.meta.location === "home");
            const away = f.participants.find((p) => p.meta.location === "away");
            const homeGoals = f.scores.find((s) => s.score.participant === "home")?.score.goals;
            const awayGoals = f.scores.find((s) => s.score.participant === "away")?.score.goals;
            const played = f.state.short_name === "FT";
            return (
              <li key={f.id} className="hover:bg-muted/20 transition-colors">
                <Link href={`/match/${f.id}`} className="flex items-center justify-between px-4 py-3 gap-3">
                  <span className="flex-1 text-right font-medium text-foreground truncate">{home?.name}</span>
                  <span className={`px-3 py-1 rounded-lg text-sm font-bold tabular-nums ${played ? "bg-muted text-foreground" : "text-muted-foreground"}`}>
                    {played && homeGoals != null && awayGoals != null
                      ? `${homeGoals} – ${awayGoals}`
                      : new Date(f.starting_at).toLocaleString("sv-SE", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                  </span>
                  <span className="flex-1 font-medium text-foreground truncate">{away?.name}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      )}

      <div className="mt-6 flex justify-between text-sm">
        {round > 1 ? (
          <Link href={`/allsvenskan/omgang/${round - 1}`} className="text-pitch hover:underline">← Omgång {round - 1}</Link>
        ) : <span />}
        {round < TOTAL_ROUNDS ? (
          <Link href={`/allsvenskan/omgang/${round + 1}`} className="text-pitch hover:underline">Omgång {round + 1} →</Link>
        ) : <span />}
      </div>
    </div>
  );
}
