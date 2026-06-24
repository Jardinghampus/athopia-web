import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { createServerClient, isSupabaseConfigured } from "@/lib/supabase";
import { ListGroup } from "@/components/ui/ListGroup";
import { ListRow } from "@/components/ui/ListRow";
import { StatNumber } from "@/components/ui/StatNumber";
import { PlayerProfileAnalytics, type ProfileMetric } from "./PlayerProfileAnalytics";

export const revalidate = 60;

const SEASON_2026 = 26806;
const QUALIFYING_MINUTES = 300;

const POS_SV: Record<string, string> = {
  goalkeeper: "Målvakt", defender: "Försvarare",
  midfielder: "Mittfältare", attacker: "Forward",
};

async function getPlayerBySlug(slug: string) {
  const { MOCK_PLAYER_SLUG, mockPlayer } = await import("@/lib/team-hub/mock");
  if (slug === MOCK_PLAYER_SLUG) return mockPlayer();
  if (!isSupabaseConfigured()) return null;
  const db = createServerClient();
  // Numerisk slug = sportmonks_id, annars slug-kolumnen
  if (/^\d+$/.test(slug)) {
    const { data } = await db.from("players").select("*").eq("sportmonks_id", parseInt(slug, 10)).maybeSingle();
    return data as Record<string, unknown> | null;
  }
  const { data } = await db.from("players").select("*").eq("slug", slug).maybeSingle();
  return data as Record<string, unknown> | null;
}

async function getSeasonStats(playerId: number) {
  const { MOCK_PLAYER_SM_ID, mockPlayerSeason } = await import("@/lib/team-hub/mock");
  if (playerId === MOCK_PLAYER_SM_ID) return mockPlayerSeason();
  if (!isSupabaseConfigured()) return null;
  const db = createServerClient();
  const { data } = await db.from("player_season_stats").select("*").eq("player_id", playerId).eq("season_id", SEASON_2026).maybeSingle();
  return data as Record<string, unknown> | null;
}

async function getMatchHistory(playerId: number) {
  const { MOCK_PLAYER_SM_ID, mockPlayerMatches } = await import("@/lib/team-hub/mock");
  if (playerId === MOCK_PLAYER_SM_ID) return mockPlayerMatches();
  if (!isSupabaseConfigured()) return [];
  const db = createServerClient();
  const { data } = await db
    .from("player_match_stats")
    .select("fixture_id,minutes_played,goals,assists,yellow_cards,red_cards,rating")
    .eq("sportsmonks_player_id", playerId)
    .order("created_at", { ascending: false })
    .limit(10);
  if (!data?.length) return [];
  // Hämta fixture-info
  const fids = data.map(r => r.fixture_id as number);
  const { data: fixes } = await db
    .from("fixtures")
    .select("sportmonks_id,home_team_name,away_team_name,home_score,away_score,kickoff_at")
    .in("sportmonks_id", fids);
  const fixMap = Object.fromEntries((fixes ?? []).map(f => [f.sportmonks_id, f]));
  return data.map(r => ({ ...r, fixture: fixMap[r.fixture_id as number] ?? null })) as Record<string, unknown>[];
}

type SeasonStat = Record<string, unknown>;

function n(row: SeasonStat | null | undefined, key: string): number {
  return Number(row?.[key] ?? 0) || 0;
}

function per90(row: SeasonStat, key: string): number {
  const minutes = n(row, "minutes");
  return minutes > 0 ? (n(row, key) / minutes) * 90 : 0;
}

function percentile(values: number[], value: number): number {
  const clean = values.filter((v) => Number.isFinite(v)).sort((a, b) => a - b);
  if (!clean.length) return 50;
  const below = clean.filter((v) => v < value).length;
  const equal = clean.filter((v) => v === value).length;
  return Math.round(((below + equal / 2) / clean.length) * 100);
}

async function getProfileMetrics(playerStats: SeasonStat | null): Promise<ProfileMetric[]> {
  if (!playerStats || !isSupabaseConfigured()) return [];
  const db = createServerClient();
  const { data } = await db
    .from("player_season_stats")
    .select("minutes,goals,assists,shots,shots_on_target,passes,tackles,interceptions,rating")
    .eq("season_id", SEASON_2026)
    .gte("minutes", QUALIFYING_MINUTES);

  const pool = ((data ?? []) as SeasonStat[]).filter((row) => n(row, "minutes") >= QUALIFYING_MINUTES);
  if (pool.length < 8) return [];

  const metricDefs = [
    { key: "goals90", label: "Mål/90", value: per90(playerStats, "goals"), values: pool.map((p) => per90(p, "goals")) },
    { key: "assists90", label: "Assist/90", value: per90(playerStats, "assists"), values: pool.map((p) => per90(p, "assists")) },
    { key: "shots90", label: "Skott/90", value: per90(playerStats, "shots"), values: pool.map((p) => per90(p, "shots")) },
    { key: "sot90", label: "Skott på mål/90", value: per90(playerStats, "shots_on_target"), values: pool.map((p) => per90(p, "shots_on_target")) },
    { key: "passes90", label: "Pass/90", value: per90(playerStats, "passes"), values: pool.map((p) => per90(p, "passes")) },
    { key: "tackles90", label: "Tackl/90", value: per90(playerStats, "tackles"), values: pool.map((p) => per90(p, "tackles")) },
    { key: "interceptions90", label: "Brytningar/90", value: per90(playerStats, "interceptions"), values: pool.map((p) => per90(p, "interceptions")) },
    { key: "rating", label: "Betyg", value: n(playerStats, "rating"), values: pool.map((p) => n(p, "rating")), decimals: 2 },
    ...(n(playerStats, "xg") > 0
      ? [{ key: "xg90", label: "xG/90", value: per90(playerStats, "xg"), values: pool.filter(p => n(p, "xg") > 0).map((p) => per90(p, "xg")), decimals: 2 }]
      : []),
  ];

  return metricDefs.map((metric) => {
    const average = metric.values.reduce((sum, v) => sum + v, 0) / metric.values.length;
    return {
      key: metric.key,
      label: metric.label,
      value: metric.value,
      average,
      percentile: percentile(metric.values, metric.value),
      decimals: metric.decimals ?? 2,
    };
  });
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const player = await getPlayerBySlug(slug);
  if (!player) return { title: "Spelare | Athopia" };
  return {
    title: `${player.fullname} | Athopia`,
    description: `Statistik för ${player.fullname} i Allsvenskan på Athopia.`,
  };
}

function StatBox({ label, value, suffix, sub }: { label: string; value: number; suffix?: string; sub?: string }) {
  return (
    <div className="bg-card dark:bg-white/[0.025] border border-border rounded-2xl p-4 text-center">
      <StatNumber value={value} suffix={suffix} className="text-3xl text-foreground" />
      <p className="text-xs text-muted-foreground mt-1">{label}</p>
      {sub && <p className="text-xs text-pitch mt-0.5">{sub}</p>}
    </div>
  );
}

export default async function SpelarePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const player = await getPlayerBySlug(slug);
  if (!player) notFound();

  const smId = player.sportmonks_id as number;
  const [stats, matches] = await Promise.all([
    getSeasonStats(smId),
    getMatchHistory(smId),
  ]);
  const profileMetrics = await getProfileMetrics(stats);

  const age = player.birthdate
    ? Math.floor((Date.now() - new Date(player.birthdate as string).getTime()) / 3.156e10)
    : null;

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10 space-y-8">
      {/* Header */}
      <div className="flex items-center gap-6">
        {!!player.image && (
          <div className="relative w-20 h-20 rounded-full overflow-hidden bg-card border border-border shrink-0">
            <Image src={player.image as string} alt={player.fullname as string} fill className="object-cover" sizes="80px" />
          </div>
        )}
        <div>
          <h1 className="font-bold text-5xl text-foreground leading-none mb-1">{player.fullname as string}</h1>
          <p className="text-muted-foreground text-sm">
            {POS_SV[player.position as string] ?? player.position ?? "–"}
            {age ? ` · ${age} år` : ""}
            {player.height ? ` · ${player.height} cm` : ""}
            {player.weight ? ` · ${player.weight} kg` : ""}
          </p>
        </div>
      </div>

      {/* Säsongstatistik 2026 */}
      {stats && (
        <div>
          <h2 className="font-semibold text-xl text-foreground mb-3">ALLSVENSKAN 2026</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-3">
            <StatBox label="Matcher"    value={(stats.appearances as number) ?? 0} />
            <StatBox label="Mål"        value={(stats.goals as number) ?? 0} />
            <StatBox label="Assist"     value={(stats.assists as number) ?? 0} />
            <StatBox label="Speltid"    value={(stats.minutes as number) ?? 0} suffix="′" />
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <StatBox label="Skott"      value={(stats.shots as number) ?? 0} />
            <StatBox label="Sk. på mål" value={(stats.shots_on_target as number) ?? 0} />
            <StatBox label="Gula kort"  value={(stats.yellow_cards as number) ?? 0} />
            <StatBox label="Röda kort"  value={(stats.red_cards as number) ?? 0} />
          </div>
          {(stats.xg as number) > 0 && (
            <div className="mt-3 grid grid-cols-2 sm:grid-cols-4 gap-3">
              <StatBox label="xG" value={stats.xg as number} suffix="" sub="Expected goals" />
              <StatBox label="xG/90" value={stats.minutes as number > 0 ? Math.round(((stats.xg as number) / (stats.minutes as number)) * 90 * 100) / 100 : 0} sub="Per 90 min" />
            </div>
          )}
          {(stats.passes as number > 0) && (
            <div className="mt-3 grid grid-cols-2 sm:grid-cols-4 gap-3">
              <StatBox label="Passningar"    value={(stats.passes as number) ?? 0} />
              <StatBox label="Tacklingar"    value={(stats.tackles as number) ?? 0} />
              <StatBox label="Interceptions" value={(stats.interceptions as number) ?? 0} />
              <StatBox label="Dribblingar"   value={(stats.dribbles as number) ?? 0} />
            </div>
          )}
        </div>
      )}

      {stats && (
        <PlayerProfileAnalytics
          playerName={player.fullname as string}
          minutes={(stats.minutes as number) ?? 0}
          qualifyingMinutes={QUALIFYING_MINUTES}
          metrics={profileMetrics}
        />
      )}

      {/* Match-för-match */}
      {matches.length > 0 && (
        <div>
          <h2 className="font-semibold text-xl text-foreground mb-3">MATCH FÖR MATCH</h2>
          <ListGroup footer="Senaste 10 matcherna. Tryck på en match för detaljer.">
            {matches.map((m, i) => {
              const fix = m.fixture as Record<string, unknown> | null;
              const goals = (m.goals as number) ?? 0;
              const assists = (m.assists as number) ?? 0;
              const yellows = (m.yellow_cards as number) ?? 0;
              const reds = (m.red_cards as number) ?? 0;
              const parts = [
                `${(m.minutes_played as number) ?? 0}′`,
                yellows > 0 ? `${yellows} gult` : null,
                reds > 0 ? `${reds} rött` : null,
              ].filter(Boolean);
              const contribution = [
                goals > 0 ? `${goals} mål` : null,
                assists > 0 ? `${assists} ast` : null,
              ].filter(Boolean).join(" · ");
              return (
                <ListRow
                  key={i}
                  href={fix ? `/match/${m.fixture_id}` : undefined}
                  title={
                    fix
                      ? `${fix.home_team_name as string} ${fix.home_score as number}–${fix.away_score as number} ${fix.away_team_name as string}`
                      : `Match #${m.fixture_id}`
                  }
                  subtitle={parts.join(" · ")}
                  trailing={
                    contribution
                      ? <span className="font-semibold tabular-nums text-foreground">{contribution}</span>
                      : <span className="tabular-nums">–</span>
                  }
                />
              );
            })}
          </ListGroup>
        </div>
      )}

      {!stats && matches.length === 0 && (
        <p className="text-sm text-muted-foreground">Ingen statistik insamlad ännu för {player.fullname as string}.</p>
      )}
    </div>
  );
}
