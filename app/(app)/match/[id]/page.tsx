import type { Metadata } from "next";
import { createServerClient, isSupabaseConfigured } from "@/lib/supabase";
import { LiveMatchClient } from "./LiveMatchClient";

interface PageProps {
  params: Promise<{ id: string }>;
}

interface MatchRow {
  fixture_id: number;
  home_team_name: string;
  away_team_name: string;
  home_score: number;
  away_score: number;
  home_xg: number | null;
  away_xg: number | null;
  home_possession: number | null;
  away_possession: number | null;
  home_shots: number | null;
  away_shots: number | null;
  home_shots_on_target: number | null;
  away_shots_on_target: number | null;
  played_at: string | null;
  milo_analyzed: boolean;
  home_sportsmonks_id: number | null;
  away_sportsmonks_id: number | null;
}

async function getMatch(fixtureId: number): Promise<MatchRow | null> {
  if (!isSupabaseConfigured()) return null;
  const db = createServerClient();
  const { data } = await db
    .from("match_stats")
    .select("*")
    .eq("fixture_id", fixtureId)
    .single();
  return (data as MatchRow | null) ?? null;
}

async function getTeamIds(homeId: number | null, awayId: number | null): Promise<string[]> {
  if (!isSupabaseConfigured() || (!homeId && !awayId)) return [];
  const db = createServerClient();
  const ids = [homeId, awayId].filter(Boolean);
  const { data } = await db
    .from("entities")
    .select("id")
    .in("metadata->>sportsmonks_id", ids.map(String));
  return ((data ?? []) as { id: string }[]).map((e) => e.id);
}

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  const fixtureId = parseInt(id, 10);
  const match = isNaN(fixtureId) ? null : await getMatch(fixtureId);

  if (!match) {
    return { title: "Match | Athopia" };
  }

  return {
    title: `${match.home_team_name} ${match.home_score}–${match.away_score} ${match.away_team_name} | Athopia`,
    description: `Matchcenter: ${match.home_team_name} vs ${match.away_team_name}. xG, statistik och live forum.`,
  };
}

export default async function MatchPage({ params }: PageProps) {
  const { id } = await params;
  const fixtureId = parseInt(id, 10);

  if (isNaN(fixtureId)) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center text-muted-foreground">
        <p>Ogiltigt match-ID.</p>
      </div>
    );
  }

  const match = await getMatch(fixtureId);
  const teamIds = match
    ? await getTeamIds(match.home_sportsmonks_id, match.away_sportsmonks_id)
    : [];

  // Match är "live" om played_at är inom senaste 2h och ej analyserad
  const isLive =
    match?.played_at != null &&
    Date.now() - new Date(match.played_at).getTime() < 2 * 60 * 60 * 1000 &&
    !match.milo_analyzed;

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-6">
        {match ? (
          <>
            <h1
              className="text-3xl font-bold text-foreground"
              style={{ fontFamily: "var(--font-bebas)" }}
            >
              {match.home_team_name} vs {match.away_team_name}
            </h1>
            <p className="text-muted-foreground text-sm mt-0.5">
              {match.played_at
                ? new Date(match.played_at).toLocaleDateString("sv-SE", {
                    weekday: "long",
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })
                : "Datum okänt"}{" "}
              · Allsvenskan
              {isLive && (
                <span className="ml-2 inline-flex items-center gap-1 text-red-500">
                  <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                  Live
                </span>
              )}
            </p>
          </>
        ) : (
          <h1
            className="text-3xl font-bold text-foreground"
            style={{ fontFamily: "var(--font-bebas)" }}
          >
            MATCH-CENTER
          </h1>
        )}
      </div>

      <LiveMatchClient
        fixtureId={fixtureId}
        initialStats={match as Parameters<typeof LiveMatchClient>[0]["initialStats"]}
        isLive={isLive}
        teamIds={teamIds}
      />

      {!match && (
        <div className="text-center py-16 text-muted-foreground">
          <p className="text-sm">Ingen data för fixture #{fixtureId}.</p>
          <p className="text-xs mt-1">
            Data samlas in automatiskt av match-collector (OS-17) efter matchslut.
          </p>
        </div>
      )}
    </div>
  );
}
