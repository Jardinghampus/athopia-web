import type { Metadata } from "next";
import { createServerClient, isSupabaseConfigured } from "@/lib/supabase";
import { MOCK_TEAM_LIST_ITEM } from "@/lib/team-hub/mock";
import { getUserPlan } from "@/lib/access";
import { MittLagDashboard } from "./MittLagDashboard";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Mitt lag",
  description: "Din personliga lag-dashboard — statistik, trupp, matcher, nyheter och forum samlat.",
};

async function getTeams(): Promise<{ name: string; slug: string; logo_url: string | null }[]> {
  if (!isSupabaseConfigured()) return [MOCK_TEAM_LIST_ITEM];
  try {
    const db = createServerClient();
    const { data } = await db.from("entities").select("name,slug,metadata").eq("type", "team").order("name");
    const teams = (data ?? [])
      .filter((t) => t.slug)
      .map((t) => {
        const meta = (t.metadata ?? {}) as Record<string, unknown>;
        return { name: String(t.name), slug: String(t.slug), logo_url: (meta.logo_url as string | null) ?? null };
      });
    return [MOCK_TEAM_LIST_ITEM, ...teams];
  } catch {
    return [MOCK_TEAM_LIST_ITEM];
  }
}

export default async function MittLagPage() {
  const [teams, plan] = await Promise.all([getTeams(), getUserPlan()]);
  return <MittLagDashboard teams={teams} initialSlug={null} plan={plan} />;
}
