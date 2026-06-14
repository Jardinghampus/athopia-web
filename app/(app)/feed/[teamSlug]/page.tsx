import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { createServerClient, isSupabaseConfigured } from "@/lib/supabase";
import { FeedClient } from "../FeedClient";

export const dynamic = "force-dynamic";

async function getTeamName(slug: string): Promise<string | null> {
  if (!isSupabaseConfigured()) return null;
  try {
    const db = createServerClient();
    const { data } = await db
      .from("entities")
      .select("name")
      .eq("type", "team")
      .eq("slug", slug)
      .maybeSingle();
    return data?.name ?? null;
  } catch {
    return null;
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ teamSlug: string }>;
}): Promise<Metadata> {
  const { teamSlug } = await params;
  const name = await getTeamName(teamSlug);
  if (!name) return { title: "Feed | Athopia" };
  return {
    title: `${name} — Feed | Athopia`,
    description: `Senaste nyheter och uppdateringar för ${name} på Athopia.`,
  };
}

export default async function TeamFeedPage({
  params,
}: {
  params: Promise<{ teamSlug: string }>;
}) {
  const { teamSlug } = await params;
  const name = await getTeamName(teamSlug);
  if (!name) notFound();

  return <FeedClient forceTeam={teamSlug} />;
}
