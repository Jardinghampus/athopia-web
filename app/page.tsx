import { redirect } from "next/navigation";
import { currentUser } from "@clerk/nextjs/server";
import type { Metadata } from "next";
import AthopiaLanding, { type LandingArticle } from "@/components/landing/AthopiaLanding";
import { SportFront } from "@/components/landing/SportFront";
import { createServerClient, isSupabaseConfigured } from "@/lib/supabase";
import { getLandingCopy } from "@/lib/landing-copy";

// ISR: servera cachad HTML direkt (snabb laddning), regenerera i bakgrunden.
// Tidigare 'force-dynamic' gjorde att varje besök blockerade på en Supabase-query
// (upp till 25s timeout) innan sidan renderades.
export const revalidate = 120;

const SEO_KEYWORDS = [
  "Allsvenskan", "Allsvenskan 2026", "Allsvenskan tabell", "Allsvenskan resultat",
  "Allsvenskan matcher", "Allsvenskan statistik", "Allsvenskan live", "Allsvenskan idag",
  "Allsvenskan spelschema", "Allsvenskan skytteliga", "svensk fotboll", "fotboll Allsvenskan",
  "AIK", "Djurgården", "Hammarby", "Malmö FF", "IFK Göteborg", "Häcken",
  "Allsvenskan nyheter", "Allsvenskan matchanalys", "Allsvenskan poängliga", "Allsvenskan statistik",
];

export const metadata: Metadata = {
  metadataBase: new URL("https://athopia.se"),
  title: "Allsvenskan 2026 – Tabell, Resultat, Matcher & Statistik | Athopia",
  description:
    "Allt om Allsvenskan 2026: live-tabell, resultat, spelschema, skytteliga och djupstatistik för alla 16 lag. Matchanalyser, nyhetsflöde och forum för ditt lag — samlat på ett ställe.",
  keywords: SEO_KEYWORDS,
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    locale: "sv_SE",
    url: "https://athopia.se",
    siteName: "Athopia",
    title: "Allsvenskan 2026 – Tabell, Resultat, Matcher & Statistik | Athopia",
    description:
      "Live-tabell, resultat, spelschema, skytteliga och djupstatistik för hela Allsvenskan 2026. Matchanalyser och forum för ditt lag.",
  },
  twitter: {
    card: "summary_large_image",
    title: "Allsvenskan 2026 – Tabell, Resultat & Statistik | Athopia",
    description:
      "Live-tabell, resultat, spelschema, skytteliga och djupstatistik för hela Allsvenskan 2026.",
  },
};

async function getLatestArticles(): Promise<LandingArticle[]> {
  if (!isSupabaseConfigured()) return [];
  try {
    const supabase = createServerClient();
    const { data } = await supabase
      .from("articles")
      .select("*")
      .eq("status", "published")
      .eq("is_processed", true)
      .order("published_at", { ascending: false })
      .limit(6);

    return ((data as Record<string, unknown>[] | null) ?? [])
      .map((row): LandingArticle => ({
        id: String(row.id ?? ""),
        slug: String(row.slug ?? ""),
        title: String(row.title ?? ""),
        summary: String(row.summary ?? row.ai_summary ?? ""),
        sourceName: String(row.source_name ?? row.sourceName ?? "Athopia"),
        publishedAt: String(row.published_at ?? row.publishedAt ?? row.created_at ?? ""),
      }))
      .filter((a) => a.slug && a.title);
  } catch {
    return [];
  }
}

function LandingJsonLd() {
  const data = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebSite",
        "@id": "https://athopia.se/#website",
        name: "Athopia",
        url: "https://athopia.se",
        inLanguage: "sv-SE",
        description:
          "Allsvenskan 2026 — tabell, resultat, matcher, skytteliga, statistik, matchanalyser och forum för alla 16 lag.",
        potentialAction: {
          "@type": "SearchAction",
          target: { "@type": "EntryPoint", urlTemplate: "https://athopia.se/nyheter?q={search_term_string}" },
          "query-input": "required name=search_term_string",
        },
      },
      {
        "@type": "SportsOrganization",
        "@id": "https://athopia.se/#allsvenskan",
        name: "Allsvenskan",
        sport: "Soccer",
        url: "https://athopia.se/allsvenskan",
      },
    ],
  };
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }} />;
}

export default async function LandingPage() {
  const user = await currentUser();
  if (user) redirect("/mitt-lag");
  const [articles, pulse, clubs, heroCopy] = await Promise.all([
    getLatestArticles(),
    getHeroPulse(),
    getClubChips(),
    getLandingCopy(),
  ]);
  return (
    <>
      <LandingJsonLd />
      <AthopiaLanding
        articles={articles}
        pulse={pulse}
        clubs={clubs}
        heroCopy={heroCopy}
        sportSlot={<SportFront articles={articles} />}
      />
    </>
  );
}

/** Riktig sportpuls i heron: live-match eller nästa avspark + serieledaren. */
async function getHeroPulse() {
  try {
    const [{ fetchLiveScores, fetchAllsvenskanFixtures, fetchStandingsFull }] = await Promise.all([
      import("@/lib/db/fixtures"),
    ]);
    const [live, fixtures, standings] = await Promise.all([
      fetchLiveScores(),
      fetchAllsvenskanFixtures(),
      fetchStandingsFull(),
    ]);
    const liveMatch = live[0] ?? null;
    const next = fixtures
      .filter((f) => f.state?.short_name === "NS" && new Date(f.starting_at).getTime() > Date.now())
      .sort((a, b) => new Date(a.starting_at).getTime() - new Date(b.starting_at).getTime())[0] ?? null;
    const leader = standings[0] ?? null;
    const match = liveMatch ?? next;
    return {
      live: !!liveMatch,
      matchName: match?.name ?? null,
      matchId: match?.id ?? null,
      kickoff: match?.starting_at ?? null,
      leaderName: leader?.team.name ?? null,
      leaderPoints: leader?.points ?? null,
    };
  } catch {
    return { live: false, matchName: null, matchId: null, kickoff: null, leaderName: null, leaderPoints: null };
  }
}

/** Alla 16 klubbar för hero-klubbväljaren. */
async function getClubChips() {
  try {
    const { fetchTeamsWithSlugs } = await import("@/lib/db/fixtures");
    const teams = await fetchTeamsWithSlugs();
    return teams
      .filter((t) => t.slug)
      .map((t) => ({ slug: t.slug as string, name: t.name, shortCode: t.short_code }));
  } catch {
    return [];
  }
}
