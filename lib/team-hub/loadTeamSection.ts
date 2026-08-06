import { notFound } from "next/navigation";
import { getTeamHub, type TeamHubPayload } from "@/lib/team-hub/queries";
import { getTeamEntityInsights } from "@/lib/supabase";
import { getUserPlan } from "@/lib/user-plan";
import type { EntityInsight } from "@/lib/types";
import type { Plan } from "@/lib/access-rules";

/**
 * Delad laddare för lagets sektionsrutter (/lag/[slug]/{matcher,trupp,statistik,...}).
 *
 * Varför den finns: efter att `?tab=` blev riktiga routes behöver fem sidor samma
 * tre anrop. Utan en gemensam ingång driver de isär — och `getTeamHub` är redan
 * `unstable_cache`:ad (60 s), så det här kostar inga extra queries.
 *
 * Kastar `notFound()` när laget inte finns, så varje route slipper egen 404-gren.
 */
export interface TeamSectionData {
  hub: TeamHubPayload;
  plan: Plan;
  insights: EntityInsight[];
}

export async function loadTeamSection(slug: string): Promise<TeamSectionData> {
  const data = await loadTeamSectionSafe(slug);
  if (!data) notFound();
  return data;
}

/**
 * Som ovan men returnerar null i stället för att 404:a. Används av sidor som
 * har eget innehåll även när laget saknas i `entities` — statistiksidan hämtar
 * via Sportmonks-id och ska inte försvinna bara för att hub-datan är tom.
 */
export async function loadTeamSectionSafe(slug: string): Promise<TeamSectionData | null> {
  const hub = await getTeamHub(slug);
  if (!hub) return null;

  const [plan, insights] = await Promise.all([
    getUserPlan(),
    getTeamEntityInsights(hub.team.id, 3),
  ]);

  return { hub, plan, insights };
}
