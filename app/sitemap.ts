import type { MetadataRoute } from "next";
import { createServerClient, isSupabaseConfigured } from "@/lib/supabase";

export const dynamic = 'force-dynamic';

const BASE = "https://athopia.se";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticRoutes: MetadataRoute.Sitemap = [
    { url: BASE, lastModified: new Date(), changeFrequency: "daily", priority: 1 },
    { url: `${BASE}/nyheter`, lastModified: new Date(), changeFrequency: "daily", priority: 0.9 },
    { url: `${BASE}/allsvenskan`, lastModified: new Date(), changeFrequency: "hourly", priority: 0.85 },
    { url: `${BASE}/allsvenskan/tabell`, lastModified: new Date(), changeFrequency: "daily", priority: 0.85 },
    { url: `${BASE}/allsvenskan/skytteliga`, lastModified: new Date(), changeFrequency: "daily", priority: 0.8 },
    { url: `${BASE}/allsvenskan/xp-tabell`, lastModified: new Date(), changeFrequency: "daily", priority: 0.75 },
    { url: `${BASE}/allsvenskan/spelschema`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.75 },
    { url: `${BASE}/allsvenskan/resultat`, lastModified: new Date(), changeFrequency: "daily", priority: 0.8 },
    { url: `${BASE}/match`, lastModified: new Date(), changeFrequency: "hourly", priority: 0.85 },
    { url: `${BASE}/statistik`, lastModified: new Date(), changeFrequency: "daily", priority: 0.75 },
    { url: `${BASE}/forum`, lastModified: new Date(), changeFrequency: "daily", priority: 0.7 },
    { url: `${BASE}/podcast`, lastModified: new Date(), changeFrequency: "daily", priority: 0.8 },
    { url: `${BASE}/prenumerera`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.6 },
    // Omgångssidor (programmatisk SEO)
    ...Array.from({ length: 30 }, (_, i) => ({
      url: `${BASE}/allsvenskan/omgang/${i + 1}`,
      lastModified: new Date(),
      changeFrequency: "daily" as const,
      priority: 0.65,
    })),
  ];

  if (!isSupabaseConfigured()) return staticRoutes;

  let articleRoutes: MetadataRoute.Sitemap = [];
  let teamRoutes: MetadataRoute.Sitemap = [];
  let playerRoutes: MetadataRoute.Sitemap = [];
  let podcastRoutes: MetadataRoute.Sitemap = [];
  let matchRoutes: MetadataRoute.Sitemap = [];
  let forumRoutes: MetadataRoute.Sitemap = [];
  const h2hRoutes: MetadataRoute.Sitemap = [];

  try {
    const supabase = createServerClient();

    const { data: articles } = await supabase
      .from("articles")
      .select("slug, published_at")
      .order("published_at", { ascending: false })
      .limit(1000);
    articleRoutes = (articles ?? []).map((a) => ({
      url: `${BASE}/artikel/${a.slug}`,
      lastModified: new Date(a.published_at),
      changeFrequency: "weekly" as const,
      priority: 0.7,
    }));

    // OBS: teams-tabellen saknar slug-kolumn — laglugs lever i entities (type='team')
    const { data: teams } = await supabase
      .from("entities")
      .select("slug, updated_at")
      .eq("type", "team")
      .not("sportmonks_id", "is", null)
      .not("slug", "is", null);
    teamRoutes = (teams ?? []).map((t) => ({
      url: `${BASE}/lag/${t.slug}`,
      lastModified: t.updated_at ? new Date(t.updated_at) : new Date(),
      changeFrequency: "daily" as const,
      priority: 0.6,
    }));

    const { data: players } = await supabase.from("players").select("slug, updated_at");
    playerRoutes = (players ?? []).map((p) => ({
      url: `${BASE}/spelare/${p.slug}`,
      lastModified: p.updated_at ? new Date(p.updated_at) : new Date(),
      changeFrequency: "weekly" as const,
      priority: 0.55,
    }));

    // Matchsidor: färdigspelade (matchrapporter, permanent SEO-värde) + kommande
    const { data: fixtures } = await supabase
      .from("fixtures")
      .select("sportmonks_id, kickoff_at, status, updated_at")
      .eq("sport", "football")
      .in("status", ["FT", "NS", "LIVE"])
      .order("kickoff_at", { ascending: false })
      .limit(500);
    matchRoutes = (fixtures ?? []).map((f) => ({
      url: `${BASE}/match/${f.sportmonks_id}`,
      lastModified: f.updated_at ? new Date(f.updated_at) : new Date(),
      changeFrequency: (f.status === "FT" ? "monthly" : "hourly") as "monthly" | "hourly",
      priority: f.status === "FT" ? 0.6 : 0.75,
    }));

    // H2H-möten (kanonisk ordning = svensk alfabetisk på slug)
    const teamSlugs = (teams ?? []).map((t) => String(t.slug)).filter(Boolean).sort((a, b) => a.localeCompare(b, "sv"));
    for (let i = 0; i < teamSlugs.length; i++) {
      for (let j = i + 1; j < teamSlugs.length; j++) {
        h2hRoutes.push({
          url: `${BASE}/allsvenskan/moten/${teamSlugs[i]}-vs-${teamSlugs[j]}`,
          lastModified: new Date(),
          changeFrequency: "weekly" as const,
          priority: 0.5,
        });
      }
    }

    // Klubbforum
    forumRoutes = (teams ?? []).map((t) => ({
      url: `${BASE}/forum/${t.slug}`,
      lastModified: new Date(),
      changeFrequency: "daily" as const,
      priority: 0.55,
    }));

    const { data: podcasts } = await supabase
      .from("podcasts")
      .select("id, published_at")
      .order("published_at", { ascending: false })
      .limit(2000);
    podcastRoutes = (podcasts ?? []).map((p) => ({
      url: `${BASE}/podcast/${p.id}`,
      lastModified: new Date(p.published_at),
      changeFrequency: "monthly" as const,
      priority: 0.5,
    }));
  } catch {
    // DB nere — returnera statiska routes
  }

  return [...staticRoutes, ...articleRoutes, ...teamRoutes, ...matchRoutes, ...h2hRoutes, ...forumRoutes, ...playerRoutes, ...podcastRoutes];
}
