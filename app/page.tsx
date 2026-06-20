import type { Metadata } from "next";
import AthopiaLanding, { type LandingArticle } from "@/components/landing/AthopiaLanding";
import { createServerClient, isSupabaseConfigured } from "@/lib/supabase";

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
  metadataBase: new URL("https://www.athopia.se"),
  title: "Allsvenskan 2026 – Tabell, Resultat, Matcher & Statistik | Athopia",
  description:
    "Allt om Allsvenskan 2026: live-tabell, resultat, spelschema, skytteliga och djupstatistik för alla 16 lag. Matchanalyser, nyhetsflöde och forum för ditt lag — samlat på ett ställe.",
  keywords: SEO_KEYWORDS,
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    locale: "sv_SE",
    url: "https://www.athopia.se",
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
      .limit(4);

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
        "@id": "https://www.athopia.se/#website",
        name: "Athopia",
        url: "https://www.athopia.se",
        inLanguage: "sv-SE",
        description:
          "Allsvenskan 2026 — tabell, resultat, matcher, skytteliga, statistik, matchanalyser och forum för alla 16 lag.",
        potentialAction: {
          "@type": "SearchAction",
          target: { "@type": "EntryPoint", urlTemplate: "https://www.athopia.se/nyheter?q={search_term_string}" },
          "query-input": "required name=search_term_string",
        },
      },
      {
        "@type": "SportsOrganization",
        "@id": "https://www.athopia.se/#allsvenskan",
        name: "Allsvenskan",
        sport: "Soccer",
        url: "https://www.athopia.se/allsvenskan",
      },
    ],
  };
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }} />;
}

export default async function LandingPage() {
  const articles = await getLatestArticles();
  return (
    <>
      <LandingJsonLd />
      <AthopiaLanding articles={articles} />
    </>
  );
}
