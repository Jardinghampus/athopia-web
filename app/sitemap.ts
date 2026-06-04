import type { MetadataRoute } from "next";
import { createServerClient, isSupabaseConfigured } from "@/lib/supabase";

const BASE = "https://athopia.se";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticRoutes: MetadataRoute.Sitemap = [
    { url: BASE, lastModified: new Date(), changeFrequency: "daily", priority: 1 },
    { url: `${BASE}/nyheter`, lastModified: new Date(), changeFrequency: "daily", priority: 0.9 },
    { url: `${BASE}/allsvenskan`, lastModified: new Date(), changeFrequency: "hourly", priority: 0.85 },
    { url: `${BASE}/podcast`, lastModified: new Date(), changeFrequency: "daily", priority: 0.8 },
    { url: `${BASE}/prenumerera`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.6 },
  ];

  if (!isSupabaseConfigured()) return staticRoutes;

  let articleRoutes: MetadataRoute.Sitemap = [];
  let teamRoutes: MetadataRoute.Sitemap = [];
  let playerRoutes: MetadataRoute.Sitemap = [];
  let podcastRoutes: MetadataRoute.Sitemap = [];

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

    const { data: teams } = await supabase.from("teams").select("slug, updated_at");
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

    const { data: podcasts } = await supabase
      .from("podcast_episodes")
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

  return [...staticRoutes, ...articleRoutes, ...teamRoutes, ...playerRoutes, ...podcastRoutes];
}
