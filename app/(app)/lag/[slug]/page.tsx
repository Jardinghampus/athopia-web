/**
 * app/lag/[slug]/page.tsx — Kanonisk lag-hub
 * ─────────────────────────────────────────────────────────────────────────────
 * Server component: hämtar ALL data server-side (getTeamHub + teams/följda/plan/
 * insights) och skickar som props till klientlagren TeamHubHeader (lagväxlare +
 * nyckeltal) och TeamHubTabs (flikar). Ingen client-fetch — SEO bevaras via
 * generateMetadata + JSON-LD. Samma URL används av /mitt-lag (redirect hit).
 * ─────────────────────────────────────────────────────────────────────────────
 */

import type { Metadata } from "next";
import { auth } from "@clerk/nextjs/server";
import { isFollowing } from "@/app/actions/follows";
import {
  createServerClient,
  getTeamEntityInsights,
  isSupabaseConfigured,
} from "@/lib/supabase";
import { getFollowedTeams } from "@/lib/dashboard/queries";
import { getUserFeedPreferences } from "@/lib/feed/getUserFeedPreferences";
import { getTeamHub } from "@/lib/team-hub/queries";
import { getUserPlan } from "@/lib/user-plan";
import { MOCK_TEAM_LIST_ITEM } from "@/lib/team-hub/mock";
import { TeamContextTracker } from "@/components/team-hub/TeamContextTracker";
import { getTeamColors, getTeamAccent } from "@/lib/team-colors";
import { TeamHubHeader } from "@/components/team-hub/TeamHubHeader";
import { TeamHubTabs } from "@/components/team-hub/TeamHubTabs";
import { TransferRadar } from "@/components/team-hub/TransferRadar";
import { PositionTrend } from "@/components/team-hub/PositionTrend";
import type { SwitcherTeam } from "@/components/team-hub/TeamSwitcher";

export const revalidate = 60;

interface TeamMeta {
  name: string;
  slug: string;
  logo_url: string | null;
}

async function getTeamMeta(slug: string): Promise<TeamMeta | null> {
  if (!isSupabaseConfigured()) return null;
  try {
    const db = createServerClient();
    const { data } = await db
      .from("entities")
      .select("name,slug,metadata")
      .eq("type", "team")
      .eq("slug", slug)
      .maybeSingle();
    if (!data) return null;
    const meta = (data.metadata ?? {}) as Record<string, unknown>;
    return {
      name: String(data.name),
      slug: String(data.slug),
      logo_url: (meta.logo_url as string | null) ?? null,
    };
  } catch {
    return null;
  }
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const team = await getTeamMeta(slug);
  if (!team) return { title: "Lag hittades inte" };
  return {
    title: `${team.name} – Allsvenskan 2026: Nyheter, Statistik & Matcher`,
    description: `Allt om ${team.name} i Allsvenskan 2026 — senaste nyheter, matchresultat, spelartrupp, statistik och lagforum.`,
    alternates: { canonical: `https://athopia.se/lag/${slug}` },
    openGraph: {
      type: "website",
      title: `${team.name} | Allsvenskan 2026`,
      description: `Nyheter, statistik och forum för ${team.name} i Allsvenskan.`,
      url: `https://athopia.se/lag/${slug}`,
      images: team.logo_url ? [{ url: team.logo_url, width: 400, height: 400, alt: `${team.name} logotyp` }] : [],
    },
  };
}

/** Alla lag för lagväxlaren (namn/slug/logo). */
async function getTeams(): Promise<SwitcherTeam[]> {
  if (!isSupabaseConfigured()) return [MOCK_TEAM_LIST_ITEM];
  try {
    const db = createServerClient();
    const { data } = await db
      .from("entities")
      .select("name,slug,sportmonks_id,metadata")
      .eq("type", "team")
      .order("name");
    const smIds = (data ?? []).map((t) => t.sportmonks_id).filter((id): id is number => id != null);
    const { data: teamsData } = smIds.length
      ? await db.from("teams").select("sportmonks_id,logo").in("sportmonks_id", smIds)
      : { data: [] as { sportmonks_id: number; logo: string | null }[] };
    const logoBySmId = new Map((teamsData ?? []).map((t) => [Number(t.sportmonks_id), t.logo]));
    return (data ?? [])
      .filter((t) => t.slug)
      .map((t) => {
        const meta = (t.metadata ?? {}) as Record<string, unknown>;
        const logo = logoBySmId.get(Number(t.sportmonks_id)) ?? (meta.logo_url as string | null) ?? null;
        return { name: String(t.name), slug: String(t.slug), logo_url: logo };
      });
  } catch {
    return [];
  }
}

async function getFollowedSlugs(): Promise<string[]> {
  const { userId } = await auth();
  if (!userId) return [];
  const followed = await getFollowedTeams(userId);
  return followed.map((t) => t.slug);
}

export default async function TeamHubPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const { userId } = await auth();
  const feedPrefs = userId ? await getUserFeedPreferences() : null;
  const newsTags = feedPrefs?.newsTags ?? null;

  const hub = await getTeamHub(slug, userId ? { newsTags } : undefined);
  if (!hub) {
    return (
      <div className="w-full px-6 sm:px-8 py-16 text-center">
        <h1 className="font-bold text-4xl text-foreground mb-4">Lag hittades inte</h1>
        <p className="text-muted-foreground">Laget <strong>{slug}</strong> finns inte i systemet ännu.</p>
      </div>
    );
  }

  const [teams, followedSlugs, plan, insights, following] = await Promise.all([
    getTeams(),
    getFollowedSlugs(),
    getUserPlan(),
    getTeamEntityInsights(hub.team.id, 2),
    isFollowing(hub.team.id),
  ]);

  const teamJsonLd = {
    "@context": "https://schema.org",
    "@type": "SportsTeam",
    name: hub.team.name,
    sport: "Soccer",
    url: `https://athopia.se/lag/${hub.team.slug}`,
    memberOf: {
      "@type": "SportsOrganization",
      name: "Allsvenskan",
      url: "https://athopia.se/allsvenskan",
    },
    ...(hub.team.logo_url ? { logo: hub.team.logo_url, image: hub.team.logo_url } : {}),
  };

  const colors = getTeamColors(hub.team.slug);

  return (
    <div
      className="max-w-6xl mx-auto pb-6"
      style={{ "--team-accent": getTeamAccent(hub.team.slug), "--team-accent-2": colors.secondary } as React.CSSProperties}
    >
      {/* Klubbfärgad accentlinje (audit T6) */}
      <div
        className="h-1.5 rounded-b-full"
        style={{ background: `linear-gradient(90deg, ${colors.primary} 0%, ${colors.secondary} 100%)` }}
        aria-hidden
      />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(teamJsonLd) }} />
      <TeamContextTracker slug={hub.team.slug} name={hub.team.name} logo_url={hub.team.logo_url} />

      <TeamHubHeader
        teams={teams}
        followedSlugs={followedSlugs}
        currentSlug={hub.team.slug}
        team={{ name: hub.team.name, logo_url: hub.team.logo_url }}
        position={hub.position}
        form={hub.form}
        stats={hub.stats}
        entityId={hub.team.id}
        initialFollowing={following}
      />

      <PositionTrend teamSlug={hub.team.slug} />

      <TransferRadar teamSlug={hub.team.slug} />

      <TeamHubTabs hub={hub} plan={plan} insights={insights} />
    </div>
  );
}
