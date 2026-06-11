import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { createServerClient, isSupabaseConfigured } from "@/lib/supabase";

export const revalidate = 60;

const SEASON_2026 = 26806;

const POS_SV: Record<string, string> = {
  goalkeeper: "Målvakt", defender: "Försvarare",
  midfielder: "Mittfältare", attacker: "Forward",
};

async function getPlayerBySlug(slug: string) {
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
  if (!isSupabaseConfigured()) return null;
  const db = createServerClient();
  const { data } = await db.from("player_season_stats").select("*").eq("player_id", playerId).eq("season_id", SEASON_2026).maybeSingle();
  return data as Record<string, unknown> | null;
}

async function getMatchHistory(playerId: number) {
  if (!isSupabaseConfigured()) return [];
  const db = createServerClient();
  const { data } = await db
    .from("player_match_stats")
    .select("fixture_id,minutes_played,goals,assists,yellow_cards,red_cards,rating,xg")
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

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const player = await getPlayerBySlug(slug);
  if (!player) return { title: "Spelare | Athopia" };
  return {
    title: `${player.fullname} | Athopia`,
    description: `Statistik för ${player.fullname} i Allsvenskan på Athopia.`,
  };
}

function StatBox({ label, value, sub }: { label: string; value: string | number; sub?: string }) {
  return (
    <div className="bg-card border border-border rounded-xl p-4 text-center">
      <p className="font-heading text-4xl text-foreground">{value}</p>
      <p className="text-xs text-muted-foreground mt-1">{label}</p>
      {sub && <p className="text-xs text-[#1D9E75] mt-0.5">{sub}</p>}
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
          <h1 className="font-heading text-5xl text-foreground leading-none mb-1">{player.fullname as string}</h1>
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
          <h2 className="font-heading text-xl text-foreground mb-3">ALLSVENSKAN 2026</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-3">
            <StatBox label="Matcher"    value={stats.appearances as number ?? 0} />
            <StatBox label="Mål"        value={stats.goals as number ?? 0} sub={stats.xg ? `xG ${Number(stats.xg).toFixed(1)}` : undefined} />
            <StatBox label="Assist"     value={stats.assists as number ?? 0} sub={stats.xa ? `xA ${Number(stats.xa).toFixed(1)}` : undefined} />
            <StatBox label="Speltid"    value={`${stats.minutes as number ?? 0}'`} />
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <StatBox label="Skott"      value={stats.shots as number ?? 0} />
            <StatBox label="Sk. på mål" value={stats.shots_on_target as number ?? 0} />
            <StatBox label="🟨 Kort"   value={stats.yellow_cards as number ?? 0} />
            <StatBox label="🟥 Kort"   value={stats.red_cards as number ?? 0} />
          </div>
          {(stats.passes as number > 0) && (
            <div className="mt-3 grid grid-cols-2 sm:grid-cols-4 gap-3">
              <StatBox label="Passningar"    value={stats.passes as number ?? 0} />
              <StatBox label="Tacklingar"    value={stats.tackles as number ?? 0} />
              <StatBox label="Interceptions" value={stats.interceptions as number ?? 0} />
              <StatBox label="Dribblingar"   value={stats.dribbles as number ?? 0} />
            </div>
          )}
        </div>
      )}

      {/* Match-för-match */}
      {matches.length > 0 && (
        <div>
          <h2 className="font-heading text-xl text-foreground mb-3">MATCH FÖR MATCH</h2>
          <div className="rounded-xl border border-border bg-card overflow-x-auto">
            <table className="w-full text-sm min-w-[500px]">
              <thead>
                <tr className="border-b border-border bg-muted/40">
                  <th className="text-left px-4 py-2 text-xs text-muted-foreground">Match</th>
                  <th className="text-center px-3 py-2 text-xs text-muted-foreground">Min</th>
                  <th className="text-center px-3 py-2 text-xs text-muted-foreground">Mål</th>
                  <th className="text-center px-3 py-2 text-xs text-muted-foreground">Ast</th>
                  <th className="text-center px-3 py-2 text-xs text-muted-foreground">xG</th>
                  <th className="text-center px-3 py-2 text-xs text-muted-foreground">🟨</th>
                </tr>
              </thead>
              <tbody>
                {matches.map((m, i) => {
                  const fix = m.fixture as Record<string, unknown> | null;
                  return (
                    <tr key={i} className="border-b border-border/40 last:border-0 hover:bg-muted/20 transition-colors">
                      <td className="px-4 py-2">
                        {fix ? (
                          <Link href={`/match/${m.fixture_id}`} className="text-foreground hover:text-[#1D9E75]">
                            {fix.home_team_name as string} {fix.home_score as number}–{fix.away_score as number} {fix.away_team_name as string}
                          </Link>
                        ) : `Match #${m.fixture_id}`}
                      </td>
                      <td className="text-center px-3 py-2 text-muted-foreground">{m.minutes_played as number ?? 0}′</td>
                      <td className="text-center px-3 py-2 font-semibold">{m.goals as number ?? 0}</td>
                      <td className="text-center px-3 py-2">{m.assists as number ?? 0}</td>
                      <td className="text-center px-3 py-2 text-muted-foreground">{m.xg ? Number(m.xg).toFixed(2) : "–"}</td>
                      <td className="text-center px-3 py-2 text-yellow-500">{m.yellow_cards as number ?? 0}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {!stats && matches.length === 0 && (
        <p className="text-sm text-muted-foreground">Ingen statistik insamlad ännu för {player.fullname as string}.</p>
      )}
    </div>
  );
}
