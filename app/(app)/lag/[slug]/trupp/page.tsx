import type { Metadata } from "next";
import { loadTeamSection } from "@/lib/team-hub/loadTeamSection";
import { TeamSection } from "@/components/team-hub/TeamSection";
import { ProductEventTracker } from "@/components/analytics/ProductEventTracker";

export const revalidate = 3600;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const { hub } = await loadTeamSection(slug);
  return {
    title: `${hub.team.name} — Trupp | Athopia`,
    description: `Spelartrupp och nyckelspelare för ${hub.team.name} i Allsvenskan.`,
    alternates: { canonical: `https://athopia.se/lag/${slug}/trupp` },
  };
}

export default async function LagTruppPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const { hub, plan, insights } = await loadTeamSection(slug);

  return (
    <div className="max-w-6xl mx-auto pb-6">
      <h1 className="font-bold text-3xl text-foreground mb-6 text-balance">
        TRUPP — {hub.team.name.toUpperCase()}
      </h1>
      <ProductEventTracker
        event="team_hub_tab_selected"
        props={{ team_slug: slug, team_id: hub.team.id, tab: "trupp" }}
      />
      <TeamSection section="trupp" hub={hub} plan={plan} insights={insights} />
    </div>
  );
}
