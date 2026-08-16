import "server-only";
import { createServerClient, isSupabaseConfigured } from "@/lib/supabase";
import type { Plan } from "@/lib/access-rules";

export type HomeClaim = {
  text: string;
};

export type HomeBrief = {
  subject: string;
  preheader: string;
  leagueHeadlines: HomeClaim[];
  stateLine: string | null;
  lead: string;
  nextUp: string | null;
  cta: { label: string; destination: string } | null;
  briefDate: string;
  moment: string;
};

type Edition = {
  subject?: string;
  preheader?: string;
  leagueHeadlines?: Array<{ text?: string }>;
  stateLine?: { text?: string };
  lead?: { text?: string };
  nextUp?: { text?: string };
  cta?: { label?: string; destination?: string };
};

function claims(items: Array<{ text?: string }> | undefined): HomeClaim[] {
  return (items ?? [])
    .map((item) => item.text?.trim())
    .filter((text): text is string => Boolean(text))
    .slice(0, 3)
    .map((text) => ({ text }));
}

export async function getLatestTeamBrief(
  teamSlug: string,
  plan: Plan,
): Promise<HomeBrief | null> {
  if (!isSupabaseConfigured() || !teamSlug) return null;
  const db = createServerClient();
  const { data, error } = await db
    .from("team_briefings" as never)
    .select("brief_date, moment, status, free_edition, pro_edition, generated_at")
    .eq("sport", "football")
    .eq("team_slug", teamSlug)
    .in("status", ["preview_ready", "approved", "scheduled", "sent"])
    .order("generated_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error || !data) return null;
  const row = data as {
    brief_date: string;
    moment: string;
    free_edition: Edition | null;
    pro_edition: Edition | null;
  };
  const edition = plan === "free" ? row.free_edition : row.pro_edition ?? row.free_edition;
  const lead = edition?.lead?.text?.trim();
  if (!edition || !lead) return null;
  const ctaLabel = edition.cta?.label?.trim();
  const ctaDest = edition.cta?.destination?.trim();
  return {
    subject: edition.subject?.trim() || `${teamSlug}: lagläget`,
    preheader: edition.preheader?.trim() || "",
    leagueHeadlines: claims(edition.leagueHeadlines),
    stateLine: edition.stateLine?.text?.trim() || null,
    lead,
    nextUp: edition.nextUp?.text?.trim() || null,
    cta: ctaLabel && ctaDest ? { label: ctaLabel, destination: ctaDest } : null,
    briefDate: row.brief_date,
    moment: row.moment,
  };
}
