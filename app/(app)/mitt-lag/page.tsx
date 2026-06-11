import type { Metadata } from "next";
import { createServerClient, isSupabaseConfigured } from "@/lib/supabase";
import { MittLagDashboard } from "./MittLagDashboard";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Mitt lag | Athopia",
  description: "Din personliga lag-dashboard — statistik, trupp, matcher, nyheter och forum samlat.",
};

async function getTeams(): Promise<{ name: string; slug: string; logo_url: string | null }[]> {
  if (!isSupabaseConfigured()) return [];
  try {
    const db = createServerClient();
    const { data } = await db.from("entities").select("name,slug,metadata").eq("type", "team").order("name");
    return (data ?? [])
      .filter((t) => t.slug)
      .map((t) => {
        const meta = (t.metadata ?? {}) as Record<string, unknown>;
        return { name: String(t.name), slug: String(t.slug), logo_url: (meta.logo_url as string | null) ?? null };
      });
  } catch {
    return [];
  }
}

export default async function MittLagPage() {
  const teams = await getTeams();
  return <MittLagDashboard teams={teams} initialSlug={null} />;
}
